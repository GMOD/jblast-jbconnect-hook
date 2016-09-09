#!/bin/bash
# copies all necessary files to setup galaxy tools
# assumption: galaxy install dir is /var/www/html/galaxy
cp -v ../galaxy/config/tool_conf.xml /var/www/html/galaxy/config/ # 

mkdir -p /var/www/html/galaxy/tools/jb_exportgff #
cp -rv ../galaxy/tools/jb_exportgff/ /var/www/html/galaxy/tools/ #

mkdir -p /var/www/html/galaxy/tools/jb_blastxml2json #
cp -rv ../galaxy/tools/jb_blastxml2json/ /var/www/html/galaxy/tools/ #

mkdir -p /var/www/html/galaxy/tools/jb_blaststart #
cp -rv ../galaxy/tools/jb_blaststart/ /var/www/html/galaxy/tools/ #

mkdir -p /var/www/html/galaxy/tools/jb_offset #
cp -rv ../galaxy/tools/jb_offset/ /var/www/html/galaxy/tools/ #

mkdir -p /var/www/html/galaxy/tools/jb_blast2gff #
cp -rv ../galaxy/tools/jb_blast2gff/ /var/www/html/galaxy/tools/ #
