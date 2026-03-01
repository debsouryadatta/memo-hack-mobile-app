// Re-export runtime API
export * from "./_generated/api";
export { default as schema } from "./schema";

// Type-only export for data model types
export type { DataModel, Doc, Id, TableNames } from "./_generated/dataModel";
