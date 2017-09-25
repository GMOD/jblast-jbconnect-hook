/**
 * @module
 * @ignore
 * @description
 * Utility Functions
 */
module.exports = {
    /**
     * return the starting coordinate
     * >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
     * @param {type} str
     * @returns {unresolved}
     */
    getRegionStart: function (str) {
        var line = str.split("\n")[0];
        var re = line.split(":")[1].split("..")[0];
        return re;
    },
    /**
     * Get parsed sequence data from FASTA file header
     * @param {type} str
     * @returns (JSON) sequence data
     */
    parseSeqData: function (str) {
        var line = str.split("\n")[0];
        return {
            seq: line.split(">")[1].split(" ")[0],
            start: line.split(":")[1].split("..")[0],
            end: line.split("..")[1].split(" ")[0],
            strand: line.indexOf('strand') >= 0 ? line.split("(")[1].split(" ")[0] : '',
            class: line.indexOf('class') >= 0 ? line.split("class=")[1].split(" ")[0] : '',
            length: line.split("length=")[1]
        };
    }
};