# geojson processing notes

## City council

Source: https://s-media.nyc.gov/agencies/dcp/assets/files/zip/data-tools/bytes/nycc_23b.zip

Download, unzip and then:
```bash
ogr2ogr -t_srs EPSG:4326 -f GeoJSON community.json nycc.shp -dialect SQLite -sql "SELECT geometry, CounDist AS dist from nycc" -lco COORDINATE_PRECISION=5
```

Save resulting geojson to src/static/data

## Community districts 

Source: https://s-media.nyc.gov/agencies/dcp/assets/files/zip/data-tools/bytes/nycd_23b.zip

Download, unzip and then:
```bash
ogr2ogr -t_srs EPSG:4326 -f GeoJSON community.json nycd.shp -dialect SQLite -sql "SELECT geometry, BoroCD AS dist from nycd" -lco COORDINATE_PRECISION=5
```

Save resulting geojson to src/static/data

## Zip codes 

Source: https://data.cityofnewyork.us/Business/Zip-Code-Boundaries/i8iw-xf4u

Download, uzip and then: 
```bash
ogr2ogr -t_srs EPSG:4326 -f GeoJSON zipcode.json ZIP_CODE_040114.shp -dialect SQLite -sql "SELECT geometry, ZIPCODE AS dist from ZIP_CODE_040114" -lco COORDINATE_PRECISION=5
```

Save resulting geojson to src/static/data