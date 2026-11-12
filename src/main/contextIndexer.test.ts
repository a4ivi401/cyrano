import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ContextIndexer } from './contextIndexer';

const temporaryDirectories: string[] = [];

function createProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyrano-index-'));
  temporaryDirectories.push(root);
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, '.gitignore'), 'ignored.ts\n', 'utf8');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=do-not-index\n', 'utf8');
  fs.writeFileSync(
    path.join(root, 'credentials.json'),
    JSON.stringify({ api_key: 'sk-proj-abcdefghijklmnopqrstuvwxyz123456' }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, 'terraform.tfvars'),
    'db_password = "a-very-secret-password-value"\n',
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, 'unsafe-config.json'),
    JSON.stringify({ npmAuthToken: 'S3cret!' }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, 'settings.xml'),
    '<settings><password>S3cret!</password></settings>',
    'utf8'
  );
  fs.writeFileSync(path.join(root, 'ignored.ts'), 'export const ignored = true;\n', 'utf8');
  fs.writeFileSync(
    path.join(root, 'src', 'Student.cs'),
    [
      'public class Student',
      '{',
      '    private readonly List<int> grades = new();',
      '    public IReadOnlyList<int> Grades => grades;',
      '    public void AddGrade(int grade)',
      '    {',
      '        if (grade < 0) throw new ArgumentOutOfRangeException();',
      '        for (var i = 0; i < 1; i++) grades.Add(grade);',
      '    }',
      '}'
    ].join('\n'),
    'utf8'
  );
  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('ContextIndexer', () => {
  it('retrieves language-neutral concepts and validates current source ranges', () => {
    const root = createProject();
    const indexer = new ContextIndexer();
    const stats = indexer.indexFolder(root);

    expect(stats?.fileCount).toBe(1);
    expect(indexer.getStaticProjectSummary()).not.toContain('private readonly');
    const retrieval = indexer.querySourceChunks('Где реализована инкапсуляция и цикл?');
    expect(retrieval.candidates.length).toBeGreaterThan(0);
    expect(retrieval.candidates[0].relativePath).toBe('src/Student.cs');
    expect(retrieval.candidates[0].matchedConcepts).toEqual(
      expect.arrayContaining(['encapsulation', 'loops'])
    );

    const sourceId = retrieval.candidates[0].sourceId;
    const resolved = indexer.resolveSourceId(sourceId);
    expect(resolved?.label).toMatch(/^Student\.cs\(\d+-\d+\)$/);

    fs.appendFileSync(path.join(root, 'src', 'Student.cs'), '\n// changed\n', 'utf8');
    expect(indexer.validateSourceId(sourceId)).toBe(false);
  });
});
