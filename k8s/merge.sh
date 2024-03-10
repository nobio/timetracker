TARGET_YAML='app.yaml'
echo ${TARGET_YAML}
rm -f $TARGET_YAML
touch $TARGET_YAML
cat admin-user.yaml > $TARGET_YAML
echo '---' >> $TARGET_YAML
cat timetracker-namespace.yaml >> $TARGET_YAML
echo '---' >> $TARGET_YAML
for f in ./*/*.yaml; do
  cat $f >> $TARGET_YAML
  echo '---' >> $TARGET_YAML
done
