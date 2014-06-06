/**
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

/*global gui*/

/**
 * Singleton object which provides some common constraint
 * names that ship with and are respected by WebODF.
 * @const
 */
gui.CommonConstraints = {
    EDIT: {
        ANNOTATIONS: {
            // Only allow deleting self-created annotations
            ONLY_DELETE_OWN: "onlyDeleteOwn"
        },
        // Only allow editing within one's own annotation,
        // and the ability to create/delete annotations in
        // the main text.
        REVIEW_MODE: "reviewMode"
    }
};
