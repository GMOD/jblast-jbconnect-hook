
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
    parseSeqData: function (str) {
        var line = str.split("\n")[0];
        return {
            seq: line.split(">")[1].split(" ")[0],
            start: line.split(":")[1].split("..")[0],
            end: line.split("..")[1].split(" ")[0],
            strand: line.split("(")[1].split(" ")[0],
            class: line.split("class=")[1].split(" ")[0],
            length: line.split("length=")[1]
        };
    }
};