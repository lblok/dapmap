/** dofscore choropleth **/


#dapmap3{
  polygon-fill: #aaaaaa;
  polygon-opacity: 0.4;
  line-color: #FFF;
  line-width: 0;
  line-opacity: 1;
}
#dapmap3 [ total <= 100] {
  polygon-fill: #800026;
  polygon-opacity: 0.8;
}
#dapmap3 [ total <= 5] {
  polygon-fill: #bd0026;
  polygon-opacity: 0.8;
}
