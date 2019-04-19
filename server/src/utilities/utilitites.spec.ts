import ava from 'ava';
import { PathResolver } from './pathResolver';
import { Location } from 'vscode-languageserver';
import { join } from 'path';
import { empty } from './typeGuards';
import { rangeEqual } from './positionHelpers';

ava('path resolver', (t) => {
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

  t.is(undefined, pathResolver.resolveUri(otherFileLocation, relative1));
  t.is(undefined, pathResolver.resolveUri(otherDirLocation, relative2));
  t.is(undefined, pathResolver.resolveUri(otherFileLocation, absolute));
  t.is(undefined, pathResolver.resolveUri(otherFileLocation, weird));

  pathResolver.volume0Path = join('root', 'example');
  pathResolver.volume0Uri = 'file://example';

  const resolvedPath = join('root', 'example', 'relative', 'path', 'file.ks');
  const resolvedUri = 'file://example/relative/path/file.ks';

  const relativeResolved1 = pathResolver.resolveUri(otherFileLocation, relative1);
  t.not(undefined, relativeResolved1);
  if (!empty(relativeResolved1)) {
    t.is(resolvedPath, relativeResolved1.path);
    t.is(resolvedUri, relativeResolved1.uri);
    t.true(rangeEqual(range, relativeResolved1.caller));
  }

  const relativeResolved2 = pathResolver.resolveUri(otherDirLocation, relative2);
  t.not(undefined, relativeResolved2);
  if (!empty(relativeResolved2)) {
    t.is(resolvedPath, relativeResolved2.path);
    t.is(resolvedUri, relativeResolved2.uri);
    t.true(rangeEqual(range, relativeResolved2.caller));
  }

  const absoluteResolved = pathResolver.resolveUri(otherFileLocation, absolute);
  t.not(undefined, absoluteResolved);
  if (!empty(absoluteResolved)) {
    t.is(resolvedPath, absoluteResolved.path);
    t.is(resolvedUri, absoluteResolved.uri);
    t.true(rangeEqual(range, absoluteResolved.caller));
  }

  const weirdResolved = pathResolver.resolveUri(otherFileLocation, weird);
  t.not(undefined, weirdResolved);
  if (!empty(weirdResolved)) {
    t.is(resolvedPath, weirdResolved.path);
    t.is(resolvedUri, weirdResolved.uri);
    t.true(rangeEqual(range, weirdResolved.caller));
  }
});
