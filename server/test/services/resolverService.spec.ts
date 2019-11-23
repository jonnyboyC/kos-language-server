import { ResolverService } from '../../src/services/resolverService';
import { Location } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { join } from 'path';
import { empty } from '../../src/utilities/typeGuards';

describe('resolver service', () => {
  test('path resolver', () => {
    const pathResolver = new ResolverService();
    const range = {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 1,
      },
    };

    const otherFileLocation: Location = {
      range,
      uri: 'file:///root/example/otherFile.ks',
    };

    const otherDirLocation: Location = {
      range,
      uri: 'file:///root/example/up/upFile.ks',
    };

    const relative1 = ['relative', 'path', 'file.ks'].join('/');
    const relative2 = ['..', 'relative', 'path', 'file.ks'].join('/');
    const absolute = ['0:', 'relative', 'path', 'file.ks'].join('/');
    const weird = ['0:relative', 'path', 'file.ks'].join('/');

    expect(pathResolver.resolve(otherFileLocation, relative1)).toBeUndefined();
    expect(pathResolver.resolve(otherDirLocation, relative2)).toBeUndefined();
    expect(pathResolver.resolve(otherFileLocation, absolute)).toBeUndefined();
    expect(pathResolver.resolve(otherFileLocation, weird)).toBeUndefined();

    pathResolver.rootVolume = URI.file(join('root', 'example'));

    const resolvedUri = 'file:///root/example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolve(
      otherFileLocation,
      relative1,
    );
    expect(undefined).not.toBe(relativeResolved1);
    if (!empty(relativeResolved1)) {
      expect(relativeResolved1.toString()).toBe(resolvedUri);
    }

    const relativeResolved2 = pathResolver.resolve(otherDirLocation, relative2);
    expect(undefined).not.toBe(relativeResolved2);
    if (!empty(relativeResolved2)) {
      expect(relativeResolved2.toString()).toBe(resolvedUri);
    }

    const absoluteResolved = pathResolver.resolve(otherFileLocation, absolute);
    expect(undefined).not.toBe(absoluteResolved);
    if (!empty(absoluteResolved)) {
      expect(absoluteResolved.toString()).toBe(resolvedUri);
    }

    const weirdResolved = pathResolver.resolve(otherFileLocation, weird);
    expect(undefined).not.toBe(weirdResolved);
    if (!empty(weirdResolved)) {
      expect(weirdResolved.toString()).toBe(resolvedUri);
    }
  });

  test('path resolver boot', () => {
    const pathResolver = new ResolverService();
    const range = {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 1,
      },
    };

    const bootFileLocation: Location = {
      range,
      uri: 'file:///root/example/boot/otherFile.ks',
    };

    const relative1 = ['relative', 'path', 'file.ks'].join('/');
    const absolute = ['0:', 'relative', 'path', 'file.ks'].join('/');
    const weird = ['0:relative', 'path', 'file.ks'].join('/');

    expect(pathResolver.resolve(bootFileLocation, relative1)).toBeUndefined();
    expect(pathResolver.resolve(bootFileLocation, absolute)).toBeUndefined();
    expect(pathResolver.resolve(bootFileLocation, weird)).toBeUndefined();

    pathResolver.rootVolume = URI.file(join('root', 'example'));

    const resolvedUri = 'file:///root/example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolve(bootFileLocation, relative1);
    expect(relativeResolved1).toBeDefined();
    if (!empty(relativeResolved1)) {
      expect(relativeResolved1.toString()).toBe(resolvedUri);
    }

    const absoluteResolved = pathResolver.resolve(bootFileLocation, absolute);
    expect(absoluteResolved).toBeDefined();
    if (!empty(absoluteResolved)) {
      expect(absoluteResolved.toString()).toBe(resolvedUri);
    }

    const weirdResolved = pathResolver.resolve(bootFileLocation, weird);
    expect(weirdResolved).toBeDefined();
    if (!empty(weirdResolved)) {
      expect(weirdResolved.toString()).toBe(resolvedUri);
    }
  });
});
