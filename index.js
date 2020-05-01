
const projection = d3.geoMercator()
    .center([70.5, 30.0])
    .scale([150 * 30]);

const path = d3.geoPath().projection(projection);
const svg = d3.select('svg.mapSVG');
const width = getPxAttr(svg, 'width')
const height = getPxAttr(svg, 'height');

let colScaleCont = d3.scaleSequential(d3.interpolatePuOr)
    .domain([100, 0]);

const DistLabels =[
  {District: "Killah Saifullah", coordinates: [321, 147]},
  {District: "Killah Abdullah", coordinates: [130, 188]},
  {District: "Pishin", coordinates: [228, 181]},
  {District: "Quetta", coordinates: [140, 260]},
  {District: "Kalat", coordinates: [157, 391]},
];

let qualCols = [
  '#7fc97f',
  '#beaed4',
  '#fdc086',
  '#ffff99',
  '#386cb0'
];

const maxRadius = 15;
const radScale = d3.scaleSqrt()
                  .range([0, maxRadius]);



async function readAndDraw(){

  const VCActor = 'Farmer';
  // read in AppleTypes data and ge data
  const appVCActors = (await d3.csv('AVC_Actors.csv'));
  const appleVC = await d3.json('AppleVC.topojson');


  const maxActor = d3.max(appVCActors.map(d => +d[VCActor]));


  radScale.domain([0, maxActor])

  // using topojson to get individual district data
  const appDists = topojson.feature(appleVC, appleVC.objects.AppleVC).features;

  const districts = appVCActors.map(d => d['District']);

  let colScale = d3.scaleOrdinal()
                  .domain(districts)
                  .range(qualCols);

  svg
    .append('g')
    .attr('class', 'mapPaths')
    .selectAll('path')
    .data(appDists)
    .enter()
    .append('path')
    .attr('class', 'region tehsil')
    .attr('d', d => path(d))
    .style('fill', d => colScale(d.properties.DISTRICT))
    //.style('fill', 'e0e0e0')
    .style('fill-opacity', .3);

  svg
    .append('g')
    .attr('class', 'distLabels')
    .selectAll('text')
    .data(DistLabels)
    .enter()
    .append('text')
    .attr('class', 'distLabel')
    .attr('x', d => d.coordinates[0])
    .attr('y', d => d.coordinates[1])
    .text(d => d.District)
    .style('text-anchor', 'middle')
    .style('fill', '#212121');

  svg
    .append('g')
    .attr('class', 'bubGroup')
    .selectAll('circle')
    .data(appVCActors)
    .enter()
    .append('circle')
    .attr('class', d => 'popCircle ' + d['Tehsil'])
    .attr('cx', d => projection([+d.X, +d.Y])[0])
    .attr('cy', d => projection([+d.X, +d.Y])[1])
    .attr('r', d => radScale(+d[VCActor]))
    .style('fill', 'teal')
    .style('fill-opacity', 0.8)
    .style('stroke', '#212121')
    .style('stroke-opacity', 0.7);

  const titleGrp = svg
      .append('g')
      .attr('class', 'titles-and-shit');

  titleGrp.append('text')
      .attr('class', 'title')
      .text(`Population of Value Chain Actors`)
      .attr('x', 250)
      .attr('y', 30)
      .style('text-anchor', 'middle');

  titleGrp.append('text')
      .attr('class', 'sub-title')
      .text(`Across Tehsils (${VCActor})`)
      .attr('x', 250)
      .attr('y', 48)
      .style('text-anchor', 'middle');

  // append a nested circle legend
  makeNestCircLegend(CSSSelect = 'svg', [400, 400], [Math.round(0.4 * maxActor), maxActor], radScale, 'Population');

  // call the append interaction Voronoi function
  const vorCircs = appendIntVoronoi(
    {
      x: d => projection([+d.X, +d.Y])[0],
      y: d => projection([+d.X, +d.Y])[1]
    },
    {
      x: d => projection([+d.X, +d.Y])[0],
      y: d => projection([+d.X, +d.Y])[1]
    },
    [
      [0, 0],
      [500, 500]
    ],
    svg,
    appVCActors,
    18
  );

  vorCircs.on('mouseover', mouseO(true));
  vorCircs.on('mouseout', mouseO(false));

  function mouseO(over){
    return function(d, i){
      const elem = d3.select(this);

      let type;

      const select = document.getElementById("AppleVCActors");
      vcActor = select.options[select.selectedIndex].value;
      let value = Math.round(+d[vcActor])
      // append title




      if (over){
        elem.append('title')
            .text(d => `${d.Tehsil.trim()} - ${value}`);
      }

      else {
        elem.select('title').remove();
      }

      const datum = elem.datum();
      const TehsilName = d.Tehsil;

      const filt = d3.selectAll('circle.popCircle')
                    .filter(d => d.Tehsil == TehsilName)

      const unFilt = d3.selectAll('circle.popCircle')
                    .filter(d => d.Tehsil != TehsilName);

      filt.transition()
          .duration(100)
          .style('fill-opacity', d => over ? 0.9 : 0.8)
          .style('stroke-width', d => over ?'2px' : '1px')
          .style('stroke-opacity', d => over ? 1 : 0.7);

      unFilt.transition()
          .duration(100)
          .style('fill-opacity', d => over ? 0.6 : 0.8)
          .style('stroke-width', d => over ?'1px' : '1px')
          .style('stroke-opacity', d => over ? 0.7 : 0.7);
    }
  }

}

readAndDraw();

function updateVCActor(svgSelect, actor, transDur){
  const tehsilCircs = svgSelect.select('g.bubGroup')
    .selectAll('circle')

  const data = tehsilCircs.data();

  const actorData = data.map(d => +d[actor]);
  const maxActorDat = d3.max(actorData);

  radScale.domain([0, maxActorDat]);

  tehsilCircs.transition()
    .duration(transDur)
    .attr('r', d => radScale(d[actor]));

  // update subtitle
  svgSelect.select('text.sub-title').text(actor);
  // update legend
  d3.select('g.circLegGroup').remove();
  makeNestCircLegend(CSSSelect = 'svg', [400, 400], [Math.round(0.4 * maxActorDat), maxActorDat], radScale, 'Population');
}

d3.select('.appVCActorControl').select('select#AppleVCActors')
  .on('input', function(d, i){
    updateVCActor(d3.select('svg.mapSVG'), this.value, 500);
  })

function getSpacedName(name){
  switch (name) {
    case 'TorKolu':
      return 'Tor Kolu';
      break;
    case 'ShinKulu':
      return 'Shin Kulu';
      break;
    default:
      return name;
      break;
  }
}

function getPxAttr(selection, attribute){
  return +selection.attr(attribute).replace('px', '')
}
