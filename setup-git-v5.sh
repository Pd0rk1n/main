#!/bin/bash

project=$(basename `pwd`)
echo "-----------------------------------------------------------------------------"
echo "this is project https://github.com/Pd0rk1n/"$project
echo "-----------------------------------------------------------------------------"
git config --global pull.rebase false
git config --global user.name "Pd0rk1n"
git config --global user.email "patrick.dorkin@hotmail.com"
sudo git config --system core.editor nano
git config --global push.default simple

git remote set-url origin git@github.com:Pd0rk1n/$project

echo "Everything set"

echo
tput setaf 6
echo "##############################################################"
echo "###################  $(basename $0) done"
echo "##############################################################"
tput sgr0
echo
