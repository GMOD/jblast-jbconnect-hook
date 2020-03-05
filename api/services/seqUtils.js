let S = require('string');

/*
 * @module
 * @description
 * Utility Functions
 */
module.exports = {
    /**
     * return the starting coordinate
     * >ctgA ctgA:3014..6130 (+ strand) class=remark length=3117
     * @param {string} str fasta header
     * @returns {int} starting coordinate
     */
    getRegionStart(str) {
        var line = str.split("\n")[0];
        var re = line.split(":")[1].split("..")[0];
        return re;
    },
    /**
     * Get parsed sequence data from FASTA file header
     * @param {string} str - fasta header string
     * @returns {JSON} fasta header parsed into JSON struct
     */
    parseSeqData(str) {
        var line = str.split("\n")[0];
        return {
            seq: line.split(">")[1].split(" ")[0],
            start: line.split(":")[1].split("..")[0],
            end: line.split("..")[1].split(" ")[0],
            strand: line.indexOf('strand') >= 0 ? line.split("(")[1].split(" ")[0] : '',
            class: line.indexOf('class') >= 0 ? line.split("class=")[1].split(" ")[0] : '',
            length: line.split("length=")[1]
        };
    },
    /**
     * make sure it's a DNA sequence - containing AGCT
     * if he sequence doesn't have a fasta header, add a fasta header
     * @param {string} seq sequence string
     * @param {string} refseq reference sequence name (used for the header)
     * @returns {string} valid sequence, or false if sequence not valid
     */
    validateSequence(seq,refseq) {
        let first = "";
        let lines = seq.split("\n");
        let count = 0;

        //if (typeof refseq !== 'undefined') return seq;

        for(let i in lines) {
            if (S(lines[i]).left(1) !== ">") {
                if (lines[i].search(/^[NAGCTnagct]*$/) !== 0) {
                    sails.log.error("non-DNA sequence");
                    return false;                   // invalid character
                }
                count += lines[i].length;
            }
        }
        if (S(lines[0]).left(1) !== ">") {
            let refseq1 = typeof refseq === 'undefined' ? 'seq' : refseq;
    
            //>chr3A chr3A:372670656..372671021 (- strand) class=gene length=366
            first = ">"+refseq1+" "+refseq1+":1.."+count+" (+ strand) class=none length="+count;
        }
        let newSeq = [];
        if (first)
            newSeq.push(first);
        for(let i in lines)
            newSeq.push(lines[i]);
        
        return newSeq.join("\n");

    },
    /**
     * count DNA letters in sequence
     * ignore fasta header if any
     * @param {string} seq sequence string
     * @returns {int} count
     */
    countSequence(seq) {
        let lines = seq.split("\n");
        let count = 0;

        for(let i in lines) {
            if (S(lines[i]).left(1) !== ">") {
                count += lines[i].length;
            }
        }
       
        return count;

    }
};