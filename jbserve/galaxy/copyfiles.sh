#!/bin/bash
cp -v config/tool_conf.xml /var/www/html/galaxy/config/ # 
mkdir -p /var/www/html/galaxy/tools/jb_blast2gff;
cp -rv tools/jb_blast2gff/ /var/www/html/galaxy/tools/ #
mkdir -p /var/www/html/galaxy/tools/jb_exportgff;
cp -rv tools/jb_exportgff/ /var/www/html/galaxy/tools/ #
mkdir -p /var/www/html/galaxy/tools/jb_blastxml2json;
cp -rv tools/jb_blastxml2json/ /var/www/html/galaxy/tools/ #
