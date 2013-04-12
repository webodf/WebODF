/*global ops*/

/**
 * @constructor
 * @implements ops.Operation
 */
ops.OpInsertTable = function OpInsertTable() {
    "use strict";

    var memberid, timestamp, initialRows, initialColumns, position, tableName, tableStyleName,
        tableColumnStyleName, tableCellStyleMatrix,
        /** @const */ tablens = "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
        /** @const */ textns = "urn:oasis:names:tc:opendocument:xmlns:text:1.0";

    this.init = function (data) {
        memberid = data.memberid;
        timestamp = data.timestamp;
        position = data.position;
        initialRows = data.initialRows;
        initialColumns = data.initialColumns;
        tableName = data.tableName;
        tableStyleName = data.tableStyleName;
        tableColumnStyleName = data.tableColumnStyleName;
        tableCellStyleMatrix = data.tableCellStyleMatrix;
    };

    function getCellStyleName(row, column) {
        var rowStyles;
        if (tableCellStyleMatrix.length === 1) {
            rowStyles = tableCellStyleMatrix[0];
        } else if (tableCellStyleMatrix.length === 3) {
            switch (row) {
                case 0:
                    rowStyles = tableCellStyleMatrix[0];
                    break;
                case initialRows - 1:
                    rowStyles = tableCellStyleMatrix[2];
                    break;
                default:
                    rowStyles = tableCellStyleMatrix[1];
                    break;
            }
        } else {
            rowStyles = tableCellStyleMatrix[row];
        }

        if (rowStyles.length === 1) {
            return rowStyles[0];
        }
        if (rowStyles.length === 3) {
            switch (column) {
                case 0:
                    return rowStyles[0];
                case initialColumns - 1:
                    return rowStyles[2];
                default:
                    return rowStyles[1];
            }
        }
        return rowStyles[column];
    }

    function createTableNode(document) {
        var tableNode = document.createElementNS(tablens, "table:table"),
            columns = document.createElementNS(tablens, "table:table-column"),
            row, cell, paragraph,
            rowCounter, columnCounter, cellStyleName;

        if (tableStyleName) {
            tableNode.setAttributeNS(tablens, "table:style-name", tableStyleName);
        }
        if (tableName) {
            tableNode.setAttributeNS(tablens, "table:name", tableName);
        }

        columns.setAttributeNS(tablens, "table:number-columns-repeated", initialColumns);
        if (tableColumnStyleName) {
            columns.setAttributeNS(tablens, "table:style-name", tableColumnStyleName);
        }

        tableNode.appendChild(columns);
        for (rowCounter = 0; rowCounter < initialRows; rowCounter += 1) {
            row = document.createElementNS(tablens, "table:table-row");
            for (columnCounter = 0; columnCounter < initialColumns; columnCounter += 1) {
                cell = document.createElementNS(tablens, "table:table-cell");
                cellStyleName = getCellStyleName(rowCounter, columnCounter);
                if (cellStyleName) {
                    cell.setAttributeNS(tablens, "table:style-name", cellStyleName);
                }
                paragraph = document.createElementNS(textns, "text:p");
                cell.appendChild(paragraph);
                row.appendChild(cell);
            }
            tableNode.appendChild(row);
        }
        return tableNode;
    }

    this.execute = function (odtDocument) {
        var domPosition = odtDocument.getPositionInTextNode(position),
            rootNode = odtDocument.getRootNode(),
            previousSibling,
            tableNode;

        if (domPosition) {
            tableNode = createTableNode(odtDocument.getDOM());
            // For now assume the table should be inserted after the current paragraph
            // or failing that, as the first element in the root node
            previousSibling = odtDocument.getParagraphElement(domPosition.textNode);
            rootNode.insertBefore(tableNode, previousSibling ? previousSibling.nextSibling : undefined);

            odtDocument.emit(ops.OdtDocument.signalTableAdded, {
                tableElement: tableNode,
                memberId: memberid,
                timeStamp: timestamp
            });
            return true;
        }
        return false;
    };

    this.spec = function () {
        return {
            optype: "InsertTable",
            memberid: memberid,
            timestamp: timestamp,
            position: position,
            initialRows: initialRows,
            initialColumns: initialColumns,
            tableName: tableName,
            tableStyleName: tableStyleName,
            tableColumnStyleName: tableColumnStyleName,
            tableCellStyleMatrix: tableCellStyleMatrix
        };
    };

};