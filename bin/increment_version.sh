export VERSION_FILE=./VERSION
oldnum=`cut -d '.' -f3 $VERSION_FILE` # minor number number <ver.maj.min>
newnum=`expr $oldnum + 1`
version=`cat $VERSION_FILE | awk -F"." '{print $1}'`.`cat $VERSION_FILE | awk -F"." '{print $2}'`.$newnum
echo $version > $VERSION_FILE
echo new version number is $version