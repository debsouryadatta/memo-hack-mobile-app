import Markdown, {
  MarkdownIt,
  type ASTNode,
  type RenderRules,
} from "react-native-markdown-display";
import { ScrollView, Text, View } from "react-native";

type MarkdownToken = {
  block?: boolean;
  markup?: string;
  content?: string;
  map?: [number, number];
};

type MarkdownBlockState = {
  src: string;
  bMarks: number[];
  tShift: number[];
  eMarks: number[];
  line: number;
  push: (type: string, tag: string, nesting: number) => MarkdownToken;
};

type MarkdownInlineState = {
  src: string;
  pos: number;
  posMax: number;
  push: (type: string, tag: string, nesting: number) => MarkdownToken;
};

type MarkdownItLike = {
  block: {
    ruler: {
      before: (
        beforeName: string,
        ruleName: string,
        rule: (
          state: MarkdownBlockState,
          startLine: number,
          endLine: number,
          silent: boolean,
        ) => boolean,
        options?: { alt?: string[] },
      ) => void;
    };
  };
  inline: {
    ruler: {
      before: (
        beforeName: string,
        ruleName: string,
        rule: (state: MarkdownInlineState, silent: boolean) => boolean,
      ) => void;
    };
  };
};

const commandReplacements: Record<string, string> = {
  alpha: "alpha",
  beta: "beta",
  gamma: "gamma",
  delta: "delta",
  Delta: "Delta",
  epsilon: "epsilon",
  theta: "theta",
  lambda: "lambda",
  mu: "mu",
  pi: "pi",
  rho: "rho",
  sigma: "sigma",
  omega: "omega",
  Omega: "Omega",
  cdot: "·",
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  approx: "≈",
  sim: "≈",
  neq: "≠",
  leq: "≤",
  geq: "≥",
  le: "≤",
  ge: "≥",
  propto: "∝",
  infty: "∞",
  degree: "°",
  circ: "°",
};

const superscriptMap: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
};

const subscriptMap: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
};

function findClosingDelimiter(
  source: string,
  from: number,
  delimiter: string,
): number {
  let cursor = from;
  while (cursor < source.length) {
    const next = source.indexOf(delimiter, cursor);
    if (next === -1) return -1;
    if (delimiter !== "$" || source[next - 1] !== "\\") return next;
    cursor = next + delimiter.length;
  }
  return -1;
}

function mathInlineRule(state: MarkdownInlineState, silent: boolean): boolean {
  const source = state.src;
  const start = state.pos;
  const openers = [
    { open: "\\(", close: "\\)" },
    { open: "\\[", close: "\\]" },
    { open: "$", close: "$" },
  ];
  const match = openers.find(({ open }) => source.startsWith(open, start));

  if (!match || (match.open === "$" && source.startsWith("$$", start))) {
    return false;
  }

  const contentStart = start + match.open.length;
  const end = findClosingDelimiter(source, contentStart, match.close);
  if (end === -1 || end === contentStart) return false;

  if (!silent) {
    const token = state.push("math_inline", "", 0);
    token.markup = match.open;
    token.content = source.slice(contentStart, end).trim();
  }

  state.pos = end + match.close.length;
  return true;
}

function mathBlockRule(
  state: MarkdownBlockState,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const lineStart = state.bMarks[startLine] + state.tShift[startLine];
  const lineEnd = state.eMarks[startLine];
  const firstLine = state.src.slice(lineStart, lineEnd).trim();
  const match = firstLine.startsWith("$$")
    ? { open: "$$", close: "$$" }
    : firstLine.startsWith("\\[")
      ? { open: "\\[", close: "\\]" }
      : null;

  if (!match) return false;
  if (silent) return true;

  const contentLines: string[] = [];
  let nextLine = startLine;
  let currentLine = firstLine.slice(match.open.length).trim();
  let closed = false;

  while (nextLine < endLine) {
    const closingIndex = currentLine.indexOf(match.close);
    if (closingIndex !== -1) {
      const beforeClose = currentLine.slice(0, closingIndex).trim();
      if (beforeClose) contentLines.push(beforeClose);
      closed = true;
      nextLine += 1;
      break;
    }

    if (currentLine) contentLines.push(currentLine);
    nextLine += 1;

    if (nextLine >= endLine) break;
    const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
    const nextEnd = state.eMarks[nextLine];
    currentLine = state.src.slice(nextStart, nextEnd).trim();
  }

  if (!closed && contentLines.length === 0) return false;

  const token = state.push("math_block", "math", 0);
  token.block = true;
  token.markup = match.open;
  token.content = contentLines.join(" ").trim();
  token.map = [startLine, nextLine];
  state.line = nextLine;

  return true;
}

function mathMarkdownPlugin(markdown: unknown): void {
  const md = markdown as MarkdownItLike;
  md.block.ruler.before("paragraph", "math_block", mathBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });
  md.inline.ruler.before("escape", "math_inline", mathInlineRule);
}

const markdownItWithMath = MarkdownIt({ typographer: true }).use(
  mathMarkdownPlugin,
);

function isBareMathFenceOpen(value: string): boolean {
  return value === "[" || value === "\\[";
}

function isBareMathFenceClose(value: string): boolean {
  return value === "]" || value === "\\]";
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function skipSpaces(source: string, index: number): number {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }
  return cursor;
}

function replaceGroupedCommand(
  source: string,
  commands: string[],
  formatter: (value: string) => string,
): string {
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const command = commands.find((candidate) =>
      source.startsWith(candidate, cursor),
    );

    if (!command) {
      output += source[cursor];
      cursor += 1;
      continue;
    }

    const groupStart = skipSpaces(source, cursor + command.length);
    if (source[groupStart] !== "{") {
      output += command;
      cursor += command.length;
      continue;
    }

    const groupEnd = findMatchingBrace(source, groupStart);
    if (groupEnd === -1) {
      output += command;
      cursor += command.length;
      continue;
    }

    output += formatter(source.slice(groupStart + 1, groupEnd));
    cursor = groupEnd + 1;
  }

  return output;
}

function replaceFractions(source: string): string {
  const commands = ["\\frac", "\\dfrac", "\\tfrac"];
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    const command = commands.find((candidate) =>
      source.startsWith(candidate, cursor),
    );

    if (!command) {
      output += source[cursor];
      cursor += 1;
      continue;
    }

    const numeratorStart = skipSpaces(source, cursor + command.length);
    if (source[numeratorStart] !== "{") {
      output += command;
      cursor += command.length;
      continue;
    }

    const numeratorEnd = findMatchingBrace(source, numeratorStart);
    const denominatorStart = skipSpaces(source, numeratorEnd + 1);
    if (numeratorEnd === -1 || source[denominatorStart] !== "{") {
      output += command;
      cursor += command.length;
      continue;
    }

    const denominatorEnd = findMatchingBrace(source, denominatorStart);
    if (denominatorEnd === -1) {
      output += command;
      cursor += command.length;
      continue;
    }

    const numerator = formatLatexMath(
      source.slice(numeratorStart + 1, numeratorEnd),
    );
    const denominator = formatLatexMath(
      source.slice(denominatorStart + 1, denominatorEnd),
    );

    const readableNumerator = needsFormulaParens(numerator)
      ? `(${numerator})`
      : numerator;
    const readableDenominator = needsFormulaParens(denominator)
      ? `(${denominator})`
      : denominator;
    output += `${readableNumerator}/${readableDenominator}`;
    cursor = denominatorEnd + 1;
  }

  return output;
}

function needsFormulaParens(value: string): boolean {
  return /[\s+\-×÷=<>≤≥≈≠∝/]/.test(value);
}

function replaceSquareRoots(source: string): string {
  let output = "";
  let cursor = 0;

  while (cursor < source.length) {
    if (!source.startsWith("\\sqrt", cursor)) {
      output += source[cursor];
      cursor += 1;
      continue;
    }

    let radicandStart = skipSpaces(source, cursor + "\\sqrt".length);
    let degree = "";

    if (source[radicandStart] === "[") {
      const degreeEnd = source.indexOf("]", radicandStart + 1);
      if (degreeEnd !== -1) {
        degree = source.slice(radicandStart + 1, degreeEnd);
        radicandStart = skipSpaces(source, degreeEnd + 1);
      }
    }

    if (source[radicandStart] !== "{") {
      output += "\\sqrt";
      cursor += "\\sqrt".length;
      continue;
    }

    const radicandEnd = findMatchingBrace(source, radicandStart);
    if (radicandEnd === -1) {
      output += "\\sqrt";
      cursor += "\\sqrt".length;
      continue;
    }

    const formattedDegree = degree ? toSuperscript(formatLatexMath(degree)) : "";
    const radicand = formatLatexMath(
      source.slice(radicandStart + 1, radicandEnd),
    );
    output += `${formattedDegree}√(${radicand})`;
    cursor = radicandEnd + 1;
  }

  return output;
}

function toSuperscript(value: string): string {
  const converted = value
    .split("")
    .map((char) => superscriptMap[char] ?? "")
    .join("");
  return converted.length === value.length ? converted : `^(${value})`;
}

function toSubscript(value: string): string {
  const converted = value
    .split("")
    .map((char) => subscriptMap[char] ?? "")
    .join("");
  return converted.length === value.length ? converted : `_${value}`;
}

function replaceScripts(source: string): string {
  return source
    .replace(/\^\{([^{}]+)\}/g, (_match, value: string) =>
      toSuperscript(formatLatexMath(value)),
    )
    .replace(/\^([A-Za-z0-9+\-=()])/g, (_match, value: string) =>
      toSuperscript(value),
    )
    .replace(/_\{([^{}]+)\}/g, (_match, value: string) =>
      toSubscript(formatLatexMath(value).replace(/\s+/g, "")),
    )
    .replace(/_([A-Za-z0-9+\-=()])/g, (_match, value: string) =>
      toSubscript(value),
    );
}

function isProbablyFormula(value: string): boolean {
  return (
    /\\(frac|dfrac|tfrac|sqrt|text|mathrm|sum|int|Delta|alpha|beta|theta|lambda|mu|pi|rho|sigma|omega)\b/.test(
      value,
    ) || /[_^]\{[^}]+\}/.test(value)
  );
}

function hasStandaloneFormulaShape(value: string): boolean {
  return (
    /[=<>≤≥≈]/.test(value) ||
    /^\\(?:frac|dfrac|tfrac|sqrt|sum|int)\b/.test(value)
  );
}

function shouldPromoteLineToMathBlock(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("\\[") || value.startsWith("$$")) return false;
  if (value.includes("\\(") || value.includes("\\)") || value.includes("$")) {
    return false;
  }
  if (value.startsWith("- ") || value.startsWith("* ")) return false;
  if (/^\d+\.\s/.test(value)) return false;

  return isProbablyFormula(value) && hasStandaloneFormulaShape(value);
}

function normalizeStandaloneLatex(source: string): string {
  const lines = source.split("\n");
  const normalized: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (isBareMathFenceOpen(trimmed)) {
      const formulaLines: string[] = [];
      let closingLineIndex = -1;

      for (let j = i + 1; j < lines.length; j += 1) {
        const candidate = lines[j] ?? "";
        const candidateTrimmed = candidate.trim();
        if (isBareMathFenceClose(candidateTrimmed)) {
          closingLineIndex = j;
          break;
        }
        formulaLines.push(candidateTrimmed);
      }

      const formula = formulaLines.filter(Boolean).join(" ");
      if (
        closingLineIndex !== -1 &&
        isProbablyFormula(formula) &&
        hasStandaloneFormulaShape(formula)
      ) {
        const indent = line.slice(0, line.indexOf(trimmed));
        normalized.push(`${indent}\\[${formula}\\]`);
        i = closingLineIndex;
        continue;
      }
    }

    if (isBareMathFenceClose(trimmed)) {
      const previous = normalized[normalized.length - 1]?.trim() ?? "";
      if (previous.startsWith("\\[") || previous.startsWith("$$")) {
        continue;
      }
    }

    if (shouldPromoteLineToMathBlock(trimmed)) {
      normalized.push(`${line.slice(0, line.indexOf(trimmed))}\\[${trimmed}\\]`);
      continue;
    }

    normalized.push(line);
  }

  return normalized.join("\n");
}

export function formatLatexMath(value: string): string {
  let result = value
    .replace(/\r/g, "")
    .replace(/^\\\[/, "")
    .replace(/\\\]$/, "")
    .replace(/^\$\$/, "")
    .replace(/\$\$$/, "")
    .trim();

  result = result
    .replace(/\\begin\{(?:aligned|align|equation|split)\*?\}/g, "")
    .replace(/\\end\{(?:aligned|align|equation|split)\*?\}/g, "")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\\\/g, "\n")
    .replace(/&/g, "");

  result = replaceGroupedCommand(
    result,
    ["\\text", "\\mathrm", "\\operatorname"],
    (inner) => inner,
  );
  result = replaceFractions(result);
  result = replaceSquareRoots(result);
  result = replaceGroupedCommand(result, ["\\bar", "\\overline"], (inner) => {
    return `${formatLatexMath(inner)}\u0304`;
  });
  result = replaceGroupedCommand(result, ["\\vec"], (inner) => {
    return `${formatLatexMath(inner)}\u20D7`;
  });

  result = result.replace(/\\([A-Za-z]+)/g, (match, command: string) => {
    return commandReplacements[command] ?? match.replace(/^\\/, "");
  });

  result = replaceScripts(result);

  return result
    .replace(/[{}]/g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*([=+×÷<>≤≥≈≠∝])\s*/g, " $1 ")
    .replace(/\s*([()])\s*/g, "$1")
    .replace(/\s*\/\s*/g, "/")
    .trim();
}

const mathRules: RenderRules = {
  math_inline: (node: ASTNode, _children, _parent, styles, inheritedStyles) => (
    <Text key={node.key} style={[inheritedStyles, styles.math_inline]}>
      {formatLatexMath(node.content)}
    </Text>
  ),
  math_block: (node: ASTNode, _children, _parent, styles) => (
    <View key={node.key} style={styles.math_block}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.math_block_scroll}
        contentContainerStyle={styles.math_block_content}
      >
        <Text selectable style={styles.math_block_text}>
          {formatLatexMath(node.content)}
        </Text>
      </ScrollView>
    </View>
  ),
};

export function ReadableMarkdown({
  children,
  style,
}: {
  children: string;
  style: Record<string, object>;
}) {
  return (
    <Markdown markdownit={markdownItWithMath} rules={mathRules} style={style}>
      {normalizeStandaloneLatex(children)}
    </Markdown>
  );
}
