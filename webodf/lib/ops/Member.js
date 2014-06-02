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

/*global ops, runtime*/

/**
 * @constructor
 */
ops.MemberProperties = function () {
    "use strict";
    /**@type{string}*/
    this.fullName;
    /**@type{string}*/
    this.color;
    /**@type{string}*/
    this.imageUrl;
};

/**
 * Class to represent a member in WebODF.
 * A member is uniquely identified by it's memberId,
 * and this class encapsulates various things like
 * the full name and also custom properties that can represent
 * information like the avatar image, color, etc.
 * Custom properties that may contain some reserved keys such as fullName
 * (string), imageUrl (string representing a URL) and color (string
 * representing CSS color value) can be passed.
 * @constructor
 * @param {!string} memberId The unique identifier of this member.
 * @param {!ops.MemberProperties} properties
 */
ops.Member = function Member(memberId, properties) {
    "use strict";

    var /**@type{!ops.MemberProperties}*/
        props = new ops.MemberProperties();

    /**
     * Returns the member ID of the member
     * @return {!string}
     */
    function getMemberId() {
        return memberId;
    }
    /**
     * Returns the properties of the member
     * (including fullName, color, and imageUrl)
     * @return {!ops.MemberProperties}
     */
    function getProperties() {
        return props;
    }
    /**
     * Sets some properties on the member
     * @param {!Object.<!string, !string>} newProperties
     * @return {undefined}
     */
    function setProperties(newProperties) {
        Object.keys(newProperties).forEach(function (key) {
            props[key] = newProperties[key];
        });
    }

    /**
     * Removes the properties specified in the object.
     * 'fullName', 'color', and 'imageUrl' are not
     * removable, they will be filtered out of 
     * removedProperties if found.
     * @param {!Object.<string,string>} removedProperties
     * @return {undefined}
     */
    function removeProperties(removedProperties) {
        Object.keys(removedProperties).forEach(function (key) {
            if (key !== "fullName" && key !== "color" && key !== "imageUrl"
                    && props.hasOwnProperty(key)) {
                delete props[key];
            }
        });
    }

    this.getMemberId = getMemberId;
    this.getProperties = getProperties;
    this.setProperties = setProperties;
    this.removeProperties = removeProperties;

    function init() {
        runtime.assert(Boolean(memberId), "No memberId was supplied!");

        if (!properties.fullName) {
            properties.fullName = runtime.tr("Unknown Author");
        }
        if (!properties.color) {
            properties.color = "black";
        }
        if (!properties.imageUrl) {
            properties.imageUrl = "avatar-joe.png";
        }

        props = properties;
    }
    init();
};
