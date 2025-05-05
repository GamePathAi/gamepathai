
// This file provides type definitions for Jest/testing frameworks
// when we're not installing the full @types/jest package

declare global {
  // Jest globals
  const describe: (name: string, fn: () => void) => void;
  const test: (name: string, fn: () => void) => void;
  const expect: any;
  const jest: any;
  const beforeEach: (fn: () => void) => void;
  const afterEach: (fn: () => void) => void;
  
  // Aliases
  const it: typeof test;
}

export {};
