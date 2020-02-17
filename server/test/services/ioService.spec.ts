import { URI } from 'vscode-uri';
import { IoService, Document, IoKind } from '../../src/services/ioService';
import { join, basename } from 'path';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const loadDir = join(testDir, 'unitTests/loadFiles');

describe('ioService', () => {
  describe('when loading a document', () => {
    test('returns the document async', async () => {
      const ioService = new IoService();
      const contents = await ioService.load(join(loadDir, 'example.ks'));
      expect(contents).toBe('print("hi").');
    });
  });

  describe('when loading a directory', () => {
    test('loads each file in turn', async () => {
      const ioService = new IoService();

      const documents: Document[] = [];
      for await (const document of ioService.loadDirectory(loadDir)) {
        documents.push(document);
      }

      expect(documents).toHaveLength(3);
      expect(
        documents.find(doc => basename(doc.uri) === 'ksconfig.json'),
      ).toBeDefined();
      expect(
        documents.find(doc => basename(doc.uri) === 'example.ks'),
      ).toBeDefined();
      expect(
        documents.find(doc => basename(doc.uri) === 'empty.ks'),
      ).toBeDefined();
    });
  });

  describe('when checking directory stats', () => {
    describe('when using a file path', () => {
      test("get stats on the file's directory", async () => {
        const ioService = new IoService();

        const entities = ioService.statDirectory(
          URI.file(join(loadDir, 'something')),
        );
        expect(entities).toHaveLength(4);

        expect(entities.filter(e => e.kind === IoKind.file)).toHaveLength(3);
        expect(entities.filter(e => e.kind === IoKind.directory)).toHaveLength(
          1,
        );

        const example = URI.file(join(loadDir, 'example.ks')).toString();
        const empty = URI.file(join(loadDir, 'empty')).toString();
        const other = URI.file(join(loadDir, 'other.js')).toString();
        const ksConfig = URI.file(join(loadDir, 'ksconfig.json')).toString();

        for (const path of [example, empty, other, ksConfig]) {
          expect(entities.filter(e => e.uri.toString() === path)).toHaveLength(
            1,
          );
        }
      });
    });

    describe('when using a directory', () => {
      test('get stats on directory ', async () => {
        const ioService = new IoService();

        const entities = ioService.statDirectory(URI.file(loadDir));
        expect(entities).toHaveLength(4);

        expect(entities.filter(e => e.kind === IoKind.file)).toHaveLength(3);
        expect(entities.filter(e => e.kind === IoKind.directory)).toHaveLength(
          1,
        );

        const example = URI.file(join(loadDir, 'example.ks')).toString();
        const empty = URI.file(join(loadDir, 'empty')).toString();
        const other = URI.file(join(loadDir, 'other.js')).toString();
        const ksConfig = URI.file(join(loadDir, 'ksconfig.json')).toString();

        for (const path of [example, empty, other, ksConfig]) {
          expect(entities.filter(e => e.uri.toString() === path)).toHaveLength(
            1,
          );
        }
      });
    });
  });

  describe('when checking if a file exists', () => {
    describe('when file exists', () => {
      describe('normalizes file path', () => {
        const ioService = new IoService();

        const ksUri = ioService.exists(URI.file(join(loadDir, 'example.ks')));
        const ksmUri = ioService.exists(URI.file(join(loadDir, 'example.ksm')));
        const blankUri = ioService.exists(URI.file(join(loadDir, 'example')));

        expect(ksUri).toBeDefined();
        expect(ksmUri).toBeDefined();
        expect(blankUri).toBeDefined();

        const match = [ksUri, ksmUri, blankUri]
          .map(uri => uri!.toString())
          .every(uri => uri === ksUri!.toString());

        expect(match).toBe(true);

        const invalidUri = ioService.exists(
          URI.file(join(loadDir, 'example.js')),
        );
        expect(invalidUri).toBeUndefined();
      });
    });

    describe('when file does not exist', () => {
      test('returns undefined', () => {
        const ioService = new IoService();

        const ksUri = ioService.exists(URI.file(join(loadDir, 'fake.ks')));
        const ksmUri = ioService.exists(URI.file(join(loadDir, 'fake.ksm')));
        const blankUri = ioService.exists(URI.file(join(loadDir, 'fake')));

        expect(ksUri).toBeUndefined();
        expect(ksmUri).toBeUndefined();
        expect(blankUri).toBeUndefined();
      });
    });
  });
});
