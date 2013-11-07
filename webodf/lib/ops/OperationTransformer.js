/**
 * @license
 * Copyright (C) 2013 KO GmbH <copyright@kogmbh.com>
 *
 * @licstart
 * This file is part of WebODF.
 *
 * WebODF is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License (GNU AGPL)
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * WebODF is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WebODF.  If not, see <http://www.gnu.org/licenses/>.
 * @licend
 *
 * @source: http://www.webodf.org/
 * @source: https://github.com/kogmbh/WebODF/
 */

/*global runtime, ops */

/*
 * create specific operation instances.
 */

runtime.loadClass("ops.OperationFactory");
runtime.loadClass("ops.OperationTransformMatrix");

/**
 * @constructor
 */
ops.OperationTransformer = function OperationTransformer() {
    "use strict";

    var operationFactory,
        operationTransformMatrix = new ops.OperationTransformMatrix();

    /**
     * @param {!Array.<!Object>} opspecs
     * @return {!Array.<!ops.Operation>}
     */
    function operations(opspecs) {
        var ops = [];

        opspecs.forEach(function(opspec) {
            ops.push(operationFactory.create(opspec));
        });

        return ops;
    }

    /**
     * TODO: priority could be read from op spec, here be an attribute from-server
     * @param {!Object} opSpecA op with lower priority in case of tie breaking
     * @param {!Object} opSpecB op with higher priority in case of tie breaking
     * @return {?{opSpecsA:!Array.<!Object>,
     *            opSpecsB:!Array.<!Object>}}
     */
    function transformOpVsOp(opSpecA, opSpecB) {
        return operationTransformMatrix.transformOpspecVsOpspec(opSpecA, opSpecB);
    }

    /**
     * @param {!Array.<!Object>} opSpecsA   sequence of ops with lower priority in case of tie breaking
     * @param {?Object} opSpecB   op with higher priority in case of tie breaking
     * @return {?{opSpecsA:!Array.<!Object>,
     *            opSpecsB:!Array.<!Object>}}
     */
    function transformOpListVsOp(opSpecsA, opSpecB) {
        var transformResult, transformListResult,
            transformedOpspecsA = [],
            transformedOpspecsB = [];

        while ((opSpecsA.length > 0) && opSpecB) {
            transformResult = transformOpVsOp(opSpecsA.shift(), /**@type {!ops.Operation}*/(opSpecB));
            // unresolvable operation conflicts?
            if (! transformResult) {
                return null;
            }

            // take transformed ops of the list A
            transformedOpspecsA = transformedOpspecsA.concat(transformResult.opSpecsA);

            // handle transformed ops of the single op B
            // opB became a noop?
            if (transformResult.opSpecsB.length === 0) {
                // so rest of opsAs stay unchanged, nothing else to do
                transformedOpspecsA = transformedOpspecsA.concat(opSpecsA);
                opSpecB = null;
                break;
            }
            // in case of opspecB transformed into multiple ops,
            // transform the remaining opsAs against any additional opsBs
            // so we can continue as if there is only one opB
            while (transformResult.opSpecsB.length > 1) {
                transformListResult = transformOpListVsOp(opSpecsA, transformResult.opSpecsB.shift());
                // unresolvable operation conflicts?
                if (! transformListResult) {
                    return null;
                }
                // take transformed ops of the single b
                transformedOpspecsB = transformedOpspecsB.concat(transformListResult.opSpecsB);
                opSpecsA = transformListResult.opSpecsA;
            }
            // continue with last of transformed opsB
            opSpecB = transformResult.opSpecsB.pop();
        }

        if (opSpecB) {
            transformedOpspecsB.push(opSpecB);
        }
        return {
            opSpecsA:  transformedOpspecsA,
            opSpecsB:  transformedOpspecsB
        };
    }

    /**
     * Sets the factory to use to create operation instances from operation specs.
     *
     * @param {!ops.OperationFactory} f
     * @return {undefined}
     */
    this.setOperationFactory = function (f) {
        operationFactory = f;
    };

    /**
     * @return {!ops.OperationTransformMatrix}
     */
    this.getOperationTransformMatrix = function () {
        return operationTransformMatrix;
    };

    /**
     * @param {!Array.<!Object>} opSpecsA   sequence of opspecs with lower priority in case of tie breaking
     * @param {!Array.<!Object>} opSpecsB   opspecs with higher priority in case of tie breaking
     * @return {?{opsA:Array.<!ops.Operation>,
     *            opsB:Array.<!ops.Operation>}}
     */
    this.transform = function (opSpecsA, opSpecsB) {
        var transformResult,
            transformedOpspecsB = [];

        // transform all opSpecsB vs. all unsent client ops
        while (opSpecsB.length > 0) {
            transformResult = transformOpListVsOp(opSpecsA, opSpecsB.shift());
            // unresolvable operation conflicts?
            if (! transformResult) {
                return null;
            }

            opSpecsA = transformResult.opSpecsA;
            transformedOpspecsB = transformedOpspecsB.concat(transformResult.opSpecsB);
        }

        return {
            opsA: operations(opSpecsA),
            opsB: operations(transformedOpspecsB)
        };
    };
};
