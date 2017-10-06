/**
 * Copyright (c) 2017 molio contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import * as Column from '../../common/column'
import * as Data from '../data-model'
import { EncodedColumn } from './encoding'
import decode from './decoder'
import { isTypedArray, typedArrayWindow } from '../../common/binary/column'
import { parseInt as fastParseInt, parseFloat as fastParseFloat } from '../../common/text/number-parser'

export default function Field(column: EncodedColumn): Data.Field {
    const mask = column.mask ? decode(column.mask) as number[] : void 0;
    const data = decode(column.data);
    const isNumeric = isTypedArray(data);

    const str: Data.Field['str'] = isNumeric
        ? mask
            ? row => mask[row] === Data.ValuePresence.Present ? '' + data[row] : ''
            : row => '' + data[row]
        : mask
            ? row => mask[row] === Data.ValuePresence.Present ? data[row] : ''
            : row => data[row];

    const int: Data.Field['int'] = isNumeric
        ? row => data[row]
        : row => { const v = data[row]; return fastParseInt(v, 0, v.length); };

    const float: Data.Field['float'] = isNumeric
        ? row => data[row]
        : row => { const v = data[row]; return fastParseFloat(v, 0, v.length); };

    const presence: Data.Field['presence'] = mask
        ? row => mask[row]
        : row => Data.ValuePresence.Present;

    const rowCount = data.length;

    return {
        isDefined: true,
        rowCount,
        str,
        int,
        float,
        presence,
        areValuesEqual: (rowA, rowB) => data[rowA] === data[rowB],
        stringEquals: (row, v) => str(row) === v,
        toStringArray: params => Column.createAndFillArray(rowCount, str, params),
        toIntArray: isNumeric
            ? params => typedArrayWindow(data, params)
            : params => Column.createAndFillArray(rowCount, int, params),
        toFloatArray: isNumeric
            ? params => typedArrayWindow(data, params)
            : params => Column.createAndFillArray(rowCount, float, params)
    };
}