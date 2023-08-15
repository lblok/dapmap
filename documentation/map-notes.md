# map notes

## choropleth class breaks

### Deregulation:

if missing = TRUE #A7A7A7 
stabloss <-.05 `#bd0026`    
stabloss < -.1 `#fc4e2a`   
stabloss < -.25 `#fd8d3c`     
stabloss < -.5 `#feb24c`   
stabloss < -.75 `#fed976`     
stabloss < -.95  `#ffffcc`       

given the need to refer to two different fields, I created a new field named stabclas    
stabclass -1 (null): #000
stabclas 0 (missing = TRUE only): `#A7A7A7`    
stabclas 1: `#bd0026`    
stabclas 2: `#fc4e2a`    
stabclas 3: `#fd8d3c`     
stabclas 4: `#feb24c`     
stabclas 5: `#fed976`     
stabclas 6: `#ffffcc`     


### Sale Risk:

ppuval ≥1000, <100000 `#800026`    
ppuval ≥100000 `#bd0026`    
ppuval ≥ 200000 `#fc4e2a`    
ppuval ≥ 350000 `#fd8d3c`    
ppuval ≥ 500000 `#feb24c`    
ppuval ≥750000 `#fed976`    
ppuval ≥ 1000000 `#ffffcc`    


### Violations Risk:

violscore > 0, <10 `#800026`    
violscore ≥10 `#bd0026`    
violscore ≥ 25 `#fc4e2a`    
violscore ≥ 50 `#fd8d3c`    
violscore ≥ 100 `#feb24c`    
violscore ≥ 200 `#fed976`    
violscore ≥ 500 `#ffffcc`    


### Evictions Risk:

evicscore > 0, <5 `#800026`    
evicscore ≥ 5 `#bd0026`    
evicscore ≥ 20 `#fc4e2a`    
evicscore ≥ 33 `#fd8d3c`    
evicscore ≥ 50 `#feb24c`    
evicscore ≥ 100 `#fed976`    
evicscore ≥ 150 `#ffffcc`    