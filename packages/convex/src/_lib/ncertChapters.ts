export const NCERT_SUBJECTS = ["physics", "chemistry", "biology"] as const;
export const NCERT_CLASSES = ["11", "12"] as const;

export type NcertSubject = (typeof NCERT_SUBJECTS)[number];
export type NcertClassLevel = (typeof NCERT_CLASSES)[number];
export type ExamTag = "neet" | "jee";

export type NcertChapter = {
  key: string;
  subject: NcertSubject;
  class: NcertClassLevel;
  title: string;
  examTags: ExamTag[];
};

const scienceTags: ExamTag[] = ["neet", "jee"];
const biologyTags: ExamTag[] = ["neet"];

export const NCERT_CHAPTERS = [
  {
    key: "physics-11-units-and-measurements",
    subject: "physics",
    class: "11",
    title: "Units and Measurements",
    examTags: scienceTags,
  },
  {
    key: "physics-11-motion-in-a-straight-line",
    subject: "physics",
    class: "11",
    title: "Motion in a Straight Line",
    examTags: scienceTags,
  },
  {
    key: "physics-11-motion-in-a-plane",
    subject: "physics",
    class: "11",
    title: "Motion in a Plane",
    examTags: scienceTags,
  },
  {
    key: "physics-11-laws-of-motion",
    subject: "physics",
    class: "11",
    title: "Laws of Motion",
    examTags: scienceTags,
  },
  {
    key: "physics-11-work-energy-and-power",
    subject: "physics",
    class: "11",
    title: "Work, Energy and Power",
    examTags: scienceTags,
  },
  {
    key: "physics-11-system-of-particles-and-rotational-motion",
    subject: "physics",
    class: "11",
    title: "System of Particles and Rotational Motion",
    examTags: scienceTags,
  },
  {
    key: "physics-11-gravitation",
    subject: "physics",
    class: "11",
    title: "Gravitation",
    examTags: scienceTags,
  },
  {
    key: "physics-11-mechanical-properties-of-solids",
    subject: "physics",
    class: "11",
    title: "Mechanical Properties of Solids",
    examTags: scienceTags,
  },
  {
    key: "physics-11-mechanical-properties-of-fluids",
    subject: "physics",
    class: "11",
    title: "Mechanical Properties of Fluids",
    examTags: scienceTags,
  },
  {
    key: "physics-11-thermal-properties-of-matter",
    subject: "physics",
    class: "11",
    title: "Thermal Properties of Matter",
    examTags: scienceTags,
  },
  {
    key: "physics-11-thermodynamics",
    subject: "physics",
    class: "11",
    title: "Thermodynamics",
    examTags: scienceTags,
  },
  {
    key: "physics-11-kinetic-theory",
    subject: "physics",
    class: "11",
    title: "Kinetic Theory",
    examTags: scienceTags,
  },
  {
    key: "physics-11-oscillations",
    subject: "physics",
    class: "11",
    title: "Oscillations",
    examTags: scienceTags,
  },
  {
    key: "physics-11-waves",
    subject: "physics",
    class: "11",
    title: "Waves",
    examTags: scienceTags,
  },
  {
    key: "physics-12-electric-charges-and-fields",
    subject: "physics",
    class: "12",
    title: "Electric Charges and Fields",
    examTags: scienceTags,
  },
  {
    key: "physics-12-electrostatic-potential-and-capacitance",
    subject: "physics",
    class: "12",
    title: "Electrostatic Potential and Capacitance",
    examTags: scienceTags,
  },
  {
    key: "physics-12-current-electricity",
    subject: "physics",
    class: "12",
    title: "Current Electricity",
    examTags: scienceTags,
  },
  {
    key: "physics-12-moving-charges-and-magnetism",
    subject: "physics",
    class: "12",
    title: "Moving Charges and Magnetism",
    examTags: scienceTags,
  },
  {
    key: "physics-12-magnetism-and-matter",
    subject: "physics",
    class: "12",
    title: "Magnetism and Matter",
    examTags: scienceTags,
  },
  {
    key: "physics-12-electromagnetic-induction",
    subject: "physics",
    class: "12",
    title: "Electromagnetic Induction",
    examTags: scienceTags,
  },
  {
    key: "physics-12-alternating-current",
    subject: "physics",
    class: "12",
    title: "Alternating Current",
    examTags: scienceTags,
  },
  {
    key: "physics-12-electromagnetic-waves",
    subject: "physics",
    class: "12",
    title: "Electromagnetic Waves",
    examTags: scienceTags,
  },
  {
    key: "physics-12-ray-optics-and-optical-instruments",
    subject: "physics",
    class: "12",
    title: "Ray Optics and Optical Instruments",
    examTags: scienceTags,
  },
  {
    key: "physics-12-wave-optics",
    subject: "physics",
    class: "12",
    title: "Wave Optics",
    examTags: scienceTags,
  },
  {
    key: "physics-12-dual-nature-of-radiation-and-matter",
    subject: "physics",
    class: "12",
    title: "Dual Nature of Radiation and Matter",
    examTags: scienceTags,
  },
  {
    key: "physics-12-atoms",
    subject: "physics",
    class: "12",
    title: "Atoms",
    examTags: scienceTags,
  },
  {
    key: "physics-12-nuclei",
    subject: "physics",
    class: "12",
    title: "Nuclei",
    examTags: scienceTags,
  },
  {
    key: "physics-12-semiconductor-electronics",
    subject: "physics",
    class: "12",
    title: "Semiconductor Electronics: Materials, Devices and Simple Circuits",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-some-basic-concepts-of-chemistry",
    subject: "chemistry",
    class: "11",
    title: "Some Basic Concepts of Chemistry",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-structure-of-atom",
    subject: "chemistry",
    class: "11",
    title: "Structure of Atom",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-classification-of-elements-and-periodicity",
    subject: "chemistry",
    class: "11",
    title: "Classification of Elements and Periodicity in Properties",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-chemical-bonding-and-molecular-structure",
    subject: "chemistry",
    class: "11",
    title: "Chemical Bonding and Molecular Structure",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-thermodynamics",
    subject: "chemistry",
    class: "11",
    title: "Thermodynamics",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-equilibrium",
    subject: "chemistry",
    class: "11",
    title: "Equilibrium",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-redox-reactions",
    subject: "chemistry",
    class: "11",
    title: "Redox Reactions",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-organic-chemistry-basic-principles-and-techniques",
    subject: "chemistry",
    class: "11",
    title: "Organic Chemistry: Some Basic Principles and Techniques",
    examTags: scienceTags,
  },
  {
    key: "chemistry-11-hydrocarbons",
    subject: "chemistry",
    class: "11",
    title: "Hydrocarbons",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-solutions",
    subject: "chemistry",
    class: "12",
    title: "Solutions",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-electrochemistry",
    subject: "chemistry",
    class: "12",
    title: "Electrochemistry",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-chemical-kinetics",
    subject: "chemistry",
    class: "12",
    title: "Chemical Kinetics",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-d-and-f-block-elements",
    subject: "chemistry",
    class: "12",
    title: "The d- and f-Block Elements",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-coordination-compounds",
    subject: "chemistry",
    class: "12",
    title: "Coordination Compounds",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-haloalkanes-and-haloarenes",
    subject: "chemistry",
    class: "12",
    title: "Haloalkanes and Haloarenes",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-alcohols-phenols-and-ethers",
    subject: "chemistry",
    class: "12",
    title: "Alcohols, Phenols and Ethers",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-aldehydes-ketones-and-carboxylic-acids",
    subject: "chemistry",
    class: "12",
    title: "Aldehydes, Ketones and Carboxylic Acids",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-amines",
    subject: "chemistry",
    class: "12",
    title: "Amines",
    examTags: scienceTags,
  },
  {
    key: "chemistry-12-biomolecules",
    subject: "chemistry",
    class: "12",
    title: "Biomolecules",
    examTags: scienceTags,
  },
  {
    key: "biology-11-the-living-world",
    subject: "biology",
    class: "11",
    title: "The Living World",
    examTags: biologyTags,
  },
  {
    key: "biology-11-biological-classification",
    subject: "biology",
    class: "11",
    title: "Biological Classification",
    examTags: biologyTags,
  },
  {
    key: "biology-11-plant-kingdom",
    subject: "biology",
    class: "11",
    title: "Plant Kingdom",
    examTags: biologyTags,
  },
  {
    key: "biology-11-animal-kingdom",
    subject: "biology",
    class: "11",
    title: "Animal Kingdom",
    examTags: biologyTags,
  },
  {
    key: "biology-11-morphology-of-flowering-plants",
    subject: "biology",
    class: "11",
    title: "Morphology of Flowering Plants",
    examTags: biologyTags,
  },
  {
    key: "biology-11-anatomy-of-flowering-plants",
    subject: "biology",
    class: "11",
    title: "Anatomy of Flowering Plants",
    examTags: biologyTags,
  },
  {
    key: "biology-11-structural-organisation-in-animals",
    subject: "biology",
    class: "11",
    title: "Structural Organisation in Animals",
    examTags: biologyTags,
  },
  {
    key: "biology-11-cell-the-unit-of-life",
    subject: "biology",
    class: "11",
    title: "Cell: The Unit of Life",
    examTags: biologyTags,
  },
  {
    key: "biology-11-biomolecules",
    subject: "biology",
    class: "11",
    title: "Biomolecules",
    examTags: biologyTags,
  },
  {
    key: "biology-11-cell-cycle-and-cell-division",
    subject: "biology",
    class: "11",
    title: "Cell Cycle and Cell Division",
    examTags: biologyTags,
  },
  {
    key: "biology-11-photosynthesis-in-higher-plants",
    subject: "biology",
    class: "11",
    title: "Photosynthesis in Higher Plants",
    examTags: biologyTags,
  },
  {
    key: "biology-11-respiration-in-plants",
    subject: "biology",
    class: "11",
    title: "Respiration in Plants",
    examTags: biologyTags,
  },
  {
    key: "biology-11-plant-growth-and-development",
    subject: "biology",
    class: "11",
    title: "Plant Growth and Development",
    examTags: biologyTags,
  },
  {
    key: "biology-11-breathing-and-exchange-of-gases",
    subject: "biology",
    class: "11",
    title: "Breathing and Exchange of Gases",
    examTags: biologyTags,
  },
  {
    key: "biology-11-body-fluids-and-circulation",
    subject: "biology",
    class: "11",
    title: "Body Fluids and Circulation",
    examTags: biologyTags,
  },
  {
    key: "biology-11-excretory-products-and-their-elimination",
    subject: "biology",
    class: "11",
    title: "Excretory Products and their Elimination",
    examTags: biologyTags,
  },
  {
    key: "biology-11-locomotion-and-movement",
    subject: "biology",
    class: "11",
    title: "Locomotion and Movement",
    examTags: biologyTags,
  },
  {
    key: "biology-11-neural-control-and-coordination",
    subject: "biology",
    class: "11",
    title: "Neural Control and Coordination",
    examTags: biologyTags,
  },
  {
    key: "biology-11-chemical-coordination-and-integration",
    subject: "biology",
    class: "11",
    title: "Chemical Coordination and Integration",
    examTags: biologyTags,
  },
  {
    key: "biology-12-sexual-reproduction-in-flowering-plants",
    subject: "biology",
    class: "12",
    title: "Sexual Reproduction in Flowering Plants",
    examTags: biologyTags,
  },
  {
    key: "biology-12-human-reproduction",
    subject: "biology",
    class: "12",
    title: "Human Reproduction",
    examTags: biologyTags,
  },
  {
    key: "biology-12-reproductive-health",
    subject: "biology",
    class: "12",
    title: "Reproductive Health",
    examTags: biologyTags,
  },
  {
    key: "biology-12-principles-of-inheritance-and-variation",
    subject: "biology",
    class: "12",
    title: "Principles of Inheritance and Variation",
    examTags: biologyTags,
  },
  {
    key: "biology-12-molecular-basis-of-inheritance",
    subject: "biology",
    class: "12",
    title: "Molecular Basis of Inheritance",
    examTags: biologyTags,
  },
  {
    key: "biology-12-evolution",
    subject: "biology",
    class: "12",
    title: "Evolution",
    examTags: biologyTags,
  },
  {
    key: "biology-12-human-health-and-disease",
    subject: "biology",
    class: "12",
    title: "Human Health and Disease",
    examTags: biologyTags,
  },
  {
    key: "biology-12-microbes-in-human-welfare",
    subject: "biology",
    class: "12",
    title: "Microbes in Human Welfare",
    examTags: biologyTags,
  },
  {
    key: "biology-12-biotechnology-principles-and-processes",
    subject: "biology",
    class: "12",
    title: "Biotechnology: Principles and Processes",
    examTags: biologyTags,
  },
  {
    key: "biology-12-biotechnology-and-its-applications",
    subject: "biology",
    class: "12",
    title: "Biotechnology and its Applications",
    examTags: biologyTags,
  },
  {
    key: "biology-12-organisms-and-populations",
    subject: "biology",
    class: "12",
    title: "Organisms and Populations",
    examTags: biologyTags,
  },
  {
    key: "biology-12-ecosystem",
    subject: "biology",
    class: "12",
    title: "Ecosystem",
    examTags: biologyTags,
  },
  {
    key: "biology-12-biodiversity-and-conservation",
    subject: "biology",
    class: "12",
    title: "Biodiversity and Conservation",
    examTags: biologyTags,
  },
] as const satisfies readonly NcertChapter[];

export function getNcertChapterByKey(key: string): NcertChapter | null {
  return NCERT_CHAPTERS.find((chapter) => chapter.key === key) ?? null;
}

export function getNcertChaptersForSubject(
  subject: NcertSubject,
): NcertChapter[] {
  return NCERT_CHAPTERS.filter((chapter) => chapter.subject === subject);
}

export function getNcertChapterGroups(): Record<
  NcertSubject,
  Record<NcertClassLevel, NcertChapter[]>
> {
  const groups = NCERT_SUBJECTS.reduce(
    (groups, subject) => {
      groups[subject] = { "11": [], "12": [] };
      return groups;
    },
    {} as Record<NcertSubject, Record<NcertClassLevel, NcertChapter[]>>,
  );
  for (const chapter of NCERT_CHAPTERS) {
    groups[chapter.subject][chapter.class].push(chapter);
  }
  return groups;
}
