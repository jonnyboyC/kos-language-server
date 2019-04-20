import * as expect from 'expect';
import { Location } from 'vscode-languageserver';
import { join } from 'path';
import { PathResolver } from '../utilities/pathResolver';
import { empty } from '../utilities/typeGuards';
import { rangeEqual } from '../utilities/positionHelpers';

test('path resolver', () => {
  const pathResolver = new PathResolver();
  const range = {
    start: {
      line: 0,
      character: 0,
    },
    end : {
      line: 0,
      character: 1,
    },
  };

  const otherFileLocation: Location = {
    range,
    uri: 'file://example/otherFile.ks',
  };

  const otherDirLocation: Location = {
    range,
    uri: 'file://example/up/upFile.ks',
  };

  const relative1 = join('relative', 'path', 'file.ks');
  const relative2 = join('..', 'relative', 'path', 'file.ks');
  const absolute = join('0:', 'relative', 'path', 'file.ks');
  const weird = join('0:relative', 'path', 'file.ks');

  expect(undefined).toBe(pathResolver.resolveUri(otherFileLocation, relative1));
  expect(undefined).toBe(pathResolver.resolveUri(otherDirLocation, relative2));
  expect(undefined).toBe(pathResolver.resolveUri(otherFileLocation, absolute));
  expect(undefined).toBe(pathResolver.resolveUri(otherFileLocation, weird));

  pathResolver.volume0Path = join('root', 'example');
  pathResolver.volume0Uri = 'file://example';

  const resolvedPath = join('root', 'example', 'relative', 'path', 'file.ks');
  const resolvedUri = 'file://example/relative/path/file.ks';

  const relativeResolved1 = pathResolver.resolveUri(otherFileLocation, relative1);
  expect(undefined).not.toBe(relativeResolved1);
  if (!empty(relativeResolved1)) {
    expect(resolvedPath).toBe(relativeResolved1.path);
    expect(resolvedUri).toBe(relativeResolved1.uri);
    expect(rangeEqual(range, relativeResolved1.caller)).toBe(true);
  }

  const relativeResolved2 = pathResolver.resolveUri(otherDirLocation, relative2);
  expect(undefined).not.toBe(relativeResolved2);
  if (!empty(relativeResolved2)) {
    expect(resolvedPath).toBe(relativeResolved2.path);
    expect(resolvedUri).toBe(relativeResolved2.uri);
    expect(rangeEqual(range, relativeResolved2.caller)).toBe(true);
  }

  const absoluteResolved = pathResolver.resolveUri(otherFileLocation, absolute);
  expect(undefined).not.toBe(absoluteResolved);
  if (!empty(absoluteResolved)) {
    expect(resolvedPath).toBe(absoluteResolved.path);
    expect(resolvedUri).toBe(absoluteResolved.uri);
    expect(rangeEqual(range, absoluteResolved.caller)).toBe(true);
  }

  const weirdResolved = pathResolver.resolveUri(otherFileLocation, weird);
  expect(undefined).not.toBe(weirdResolved);
  if (!empty(weirdResolved)) {
    expect(resolvedPath).toBe(weirdResolved.path);
    expect(resolvedUri).toBe(weirdResolved.uri);
    expect(rangeEqual(range, weirdResolved.caller)).toBe(true);
  }
});
