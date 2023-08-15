# csv_review.md

Notes on reading the 102M (850,000 row) attribute CSV with 20 million cells

1. Create a venv with pandas
```python
pipenv install pandas
```

2. Use the shell to open the CSV and get some basic info
```python
pipenv shell
python3
import csv
import pandas as pd
import numpy as np

df = pd.read_csv('~/Downloads/dapmap_v12_2.csv')
df.head()
df['stabloss'].max()
df['stabloss'].min()
df['stabloss'].value_counts()['NA']
df['stabloss'].isna().sum()
```

3. Some initial cleanup
```python
df.rename(columns={'Unnamed: 0':'did'}, inplace=True)
```


4. Export to CSV
```python
df.to_csv('file.csv', na_rep='', index=False, quoting=csv.QUOTE_NONNUMERIC)
```
4. Exit pipenv
```python
exit()
exit
```
