import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/employerContractActions.ts', import.meta.url), 'utf8');
const pageSource = await readFile(new URL('../src/pages/employer/EmployerContractsPage.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2021 },
}).outputText;
const { canDeleteEmployerContract } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('delete button rendering is gated by the backend deletion-eligibility flag', () => {
  assert.match(pageSource, /\{canDeleteEmployerContract\(contract\) \? \(/);
  for (const lifecycle of ['cancelled', 'unfunded', 'released']) {
    assert.equal(canDeleteEmployerContract({ status: lifecycle, availableActions: { delete: true } }), true);
  }
});

test('delete action stays hidden for funded, pending, and unresolved financial states', () => {
  for (const availableActions of [
    { delete: false },
    { delete: undefined },
    undefined,
  ]) {
    assert.equal(canDeleteEmployerContract({ availableActions }), false);
  }
});
