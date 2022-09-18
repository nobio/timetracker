rm -f app.yaml
touch app.yaml
cat timetracker-namespace.yaml > app.yaml
echo '---' >> app.yaml
for f in ./*/*.yaml; do
  cat $f >> app.yaml
  echo '---' >> app.yaml
done
