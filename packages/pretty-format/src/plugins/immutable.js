/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

import type {Config, Printer, NewPlugin, Refs} from 'types/PrettyFormat';
import {printIteratorEntries, printIteratorValues} from '../collections';

// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
const IS_RECORD_SENTINEL = '@@__IMMUTABLE_RECORD__@@'; // v4 or later
const IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';
const IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';
const IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';
const IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';
const IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';
const IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

const getImmutableName = name => 'Immutable.' + name;
const SPACE = ' ';

const printImmutableEntries = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  type: string,
): string =>
  ++depth > config.maxDepth
    ? '[' + getImmutableName(type) + ']'
    : getImmutableName(type) +
      SPACE +
      '{' +
      (val.size !== 0
        ? printIteratorEntries(
            val.entries(),
            config,
            indentation,
            depth,
            refs,
            printer,
          )
        : config.spacingOuter + indentation) +
      '}';

// Return an iterator for Immutable Record in v4 or later.
const getRecordEntries = val => {
  let i = 0;
  return {
    next() {
      if (i < val._keys.length) {
        const key = val._keys[i++];
        return {done: false, value: [key, val.get(key)]};
      }
      return {done: true};
    },
  };
};

const printImmutableRecord = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  // _name property is defined only for an Immutable Record instance
  // which was constructed with a second optional descriptive name arg
  const name = getImmutableName(val._name || 'Record');
  const size = Array.isArray(val._keys) ? val._keys.length : val.size;
  const entries = typeof Array.isArray(val._keys)
    ? getRecordEntries(val) // v4 or later
    : val.entries(); // v3 or earlier
  return ++depth > config.maxDepth
    ? '[' + name + ']'
    : name +
      SPACE +
      '{' +
      (size !== 0
        ? printIteratorEntries(
            entries,
            config,
            indentation,
            depth,
            refs,
            printer,
          )
        : config.spacingOuter + indentation) +
      '}';
};

const printImmutableValues = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
  type: string,
): string =>
  ++depth > config.maxDepth
    ? '[' + getImmutableName(type) + ']'
    : getImmutableName(type) +
      SPACE +
      '[' +
      (val.size !== 0
        ? printIteratorValues(
            val.values(),
            config,
            indentation,
            depth,
            refs,
            printer,
          )
        : config.spacingOuter + indentation) +
      ']';

export const serialize = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  printer: Printer,
): string => {
  if (val[IS_MAP_SENTINEL]) {
    return printImmutableEntries(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedMap' : 'Map',
    );
  }

  if (val[IS_LIST_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'List',
    );
  }
  if (val[IS_SET_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      val[IS_ORDERED_SENTINEL] ? 'OrderedSet' : 'Set',
    );
  }
  if (val[IS_STACK_SENTINEL]) {
    return printImmutableValues(
      val,
      config,
      indentation,
      depth,
      refs,
      printer,
      'Stack',
    );
  }

  if (val[IS_SEQ_SENTINEL]) {
    return '[' + getImmutableName('Seq') + ']';
  }

  // For compatibility with immutable v3 and v4, let record be the default.
  return printImmutableRecord(val, config, indentation, depth, refs, printer);
};

export const test = (val: any) =>
  val && (val[IS_ITERABLE_SENTINEL] || val[IS_RECORD_SENTINEL]);

export default ({serialize, test}: NewPlugin);