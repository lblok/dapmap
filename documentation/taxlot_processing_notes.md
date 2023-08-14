# Taxlots processing

Prerequisites:
- [OGR/GDAL](https://gdal.org/download.html) 
- [Tippecanoe](https://github.com/mapbox/tippecanoe)
- [pmtiles](https://github.com/protomaps/PMTiles)
- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

1. Download taxlots from:
https://www.nyc.gov/site/planning/data-maps/open-data/dwn-pluto-mappluto.page
https://s-media.nyc.gov/agencies/dcp/assets/files/zip/data-tools/bytes/nyc_mappluto_23v1_2_shp.zip

2. Edit CSV attributes (104M) provided by ANHD:
https://drive.google.com/file/d/1TyYXdQlIseUBZtkF-KseptFmQyKFECrl/view?usp=sharing

See csv_review.md for additional notes, especially the addition of new classified fields

3. MapPLUTO comes with BBL as an integer stored as float. QGIS has trouble joining this to the integer `bbl` in the CSV. Refactor this field to integer, then save the result as a shapefile. You can drop all fields but `bbl` in this step.

See [this thread for more info on how to refactor fields](https://gis.stackexchange.com/questions/247373/how-to-change-the-type-of-a-column-of-an-attribute-table-in-qgis)

4. In QGIS, join attributes to shapefile using the common field 'bbl'. Notes on joining attributes in QGIS: https://guides.library.duke.edu/QGIS/Joins. Save the result as-is to a new shapefile.

4. In QGIS, Refactor fields from string to int/float, as appropriate:
- address (text)
- borough (text)
- zipcode (int32)
- numbldgs (int64)
- unitsres (int32)
- unitscomm (int32)
- unitstotal (int32)
- yearbuilt (int32)
- saleprice (int64)
- uc2007 (int32)
- uc2019 (int32)
- uc2020 (int32)
- uc2021 (int32)
- decrease (text)
- missing (text)
- stabloss (Double P5)
- sale_price (Double P0)
- sale_date (text)
- total_unit (int32)
- ppuval (Double P5)
- violscore (Double P5)
- violoations (int32)
- evictions (int32)
- evicscore (Double P5)

See [this thread for more info on how to refactor fields](https://gis.stackexchange.com/questions/247373/how-to-change-the-type-of-a-column-of-an-attribute-table-in-qgis)

5. In QGIS "properties -> fields", rename and drop fields as needed, then save as SHP
- If you have not already, drop all fields from the Pluto file, except for 'BBL'
- Keep all fields from the DAP attributes CSV except `did` and `borocode`, but "refactored" as shown above

6. Reproject to 4326 and convert SHP to GeoJSON
```bash
ogr2ogr -t_srs EPSG:4326 -f GeoJSON taxlots_4326.json taxlots_joined_refactored.shp -lco "COORDINATE_PRECISION=5"
```

Important Hack: Edit this geojson in a text editor, and replace `"stabloss": null` with `"stabloss": -9999` so that it is maintained in the PMTiles, and we can symbolize in MapLibre


7. Convert GeoJSON to pmtiles: 
Initial strategy: 
- only generate z9 to z20
- z9 to z12 (or so), generalize to keep tiles as small as possible
- z13 to z20, full resolution
- join these together with the `tile-join` utility of Tippecanoe

```bash
# z10 tiles include one that is 2.5 MB, but this is about the best overall that I've landed on
tippecanoe -Z9 -z19 --simplification=10 --drop-densest-as-needed --maximum-tile-bytes=2800000 --no-feature-limit --detect-shared-borders --simplify-only-low-zooms -o allzooms.pmtiles taxlots_4326.json

 # Sadly, this doesn't seem to be working https://github.com/felt/tippecanoe/issues/7
 # So we have to use the single tile above
 # tile-join --no-tile-size-limit -o allzooms.pmtiles z9_z12.pmtiles z13_z20.pmtiles
 ```


8. Create the bucket on S3, and add the following bucket policy:
```bash
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::anhd-dap-maptiles/*"
        }
    ]
}
```

10. Use AWS console or CLI to copy the pmtiles file to S3