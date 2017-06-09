/****************
Código en Javascript para la visualización del grafo de exposiciones y artistas

Autor: Juan Fernando Correa
****************/


//definicion inicializacion de variables globales del la configuracion del lienzo    
var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 1000 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scale.linear()
    .domain([0, height])
    .range([height, 0]);


var scaleFactor = 0.5;
var translation = [0,0];


var zoom = d3.behavior.zoom()
//    .scaleExtent([0.5, 6])
    .on("zoom", szum);

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
//    .on("dragstart", dragstarted)
//    .on("drag", dragged)
//    .on("dragend", dragended)
;


//var x = d3.scale.linear()
//    .domain([0, width])
//    .range([0, width]);
//
//var y = d3.scale.linear()
//    .domain([0, height])
//    .range([height, 0]);
var div = d3.select("#cuerpo").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
//

var svg=d3.select("#grafico").append("svg")
        .attr("width",width)
        .attr("height",height);

var svgg=svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
    .call(zoom)
    .append("g");

svg.style("cursor","move");
//inicializacion de varibles globales
//escalaas d3    
var escalaradio=d3.scale.sqrt();
var escalacarga=d3.scale.sqrt();
var escalaenlaces=d3.scale.sqrt();    
var color=d3.scale.category10();    

var highlight_color = "#22e2db";
var default_link_color="#b2b2b2";
var highlight_trans = 0.2;  
var outline = false;    
    
//definicion de valriables globles para del force layout
var fuerza= null;
var nodos= [];
var enlaces= [];
var datos= null;    
var dir_archivo="data/MLT_DB_07_2016 - enlaces-MLT.csv";  
var in_carga=2; 
var in_gravedad=1;
var in_friccion=0.8;
//var los44=artistasSeleccion();
//Toggle stores whether the highlighting is on
var toggle = 0;

//representación visual de elementos
//nodos    
var visnodos=svgg.selectAll(".nodo");
var circle=null;
var visenlaces=svgg.selectAll(".enlace");  
var focus_node = null, highlight_node = null;
var nlabel= null;

//matriz de conectividad
var linkedByIndex = {};
//inicializar la fuerza
fuerza=d3.layout.force()
        .nodes(nodos)
        .links(enlaces)
        .size([width,height])
        .gravity(in_gravedad)
        .friction(in_friccion)
        .charge(escalacarga)
        .on("tick", tick)
//        .linkDistance(40)
        ;    
    
    
        
cargardatos(dir_archivo);

  
    

//funciones
	
//inicialización del force layout  
function iniciarfuerza(){
    
enlaces.forEach(function(d) {
	linkedByIndex[d.source + "," + d.target] = true;
    });    
    
console.log("iniciar la fuerza");    
fuerza.nodes(nodos)
      .links(enlaces)
//      .linkStrength(0.001)
      .start();
//        fuerza.stop();   
console.log("tras iniciar: fuerza.nodes()")    
console.log(fuerza.nodes())
console.log("var global nodos");
console.log(nodos);
console.log("linkedByIndex");
console.log(linkedByIndex);    

//inicializacion de variables dependientes de los datos
// escalas
escalaradio.domain([1, d3.max(nodos,function(d){return d.weight;})])
            .range([3,15]); 
escalacarga.domain([1, d3.max(nodos,function(d){return d.weight;})])
            .range([-60,-300]);
escalaenlaces.domain([d3.min(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                }),d3.max(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                })])
            .range([height/10,height/20]);

console.log("enlaces min max")
console.log(d3.min(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                }),d3.max(enlaces,function(l,i){
                var a;
                if(l.source.weight<l.target.weight) 
                    return l.target.weight/l.source.weight;
                else 
                    return l.source.weight/l.target.weight;
                })); 

//objeto para los efectos del pan y zum    
var container = svgg.append("g");
container.append("rect")
    .attr("class", "overlay")
    .attr("width", width-margin.left)
    .attr("height", height-margin.top);
    
//bindig de los enlaces    
visenlaces=visenlaces.data(enlaces)
              .enter().append("g").append("line")
              .attr("class","enlace")
              .attr("stroke",default_link_color)
                ;    
//bindig de los nodos    
visnodos=visnodos.data(nodos)
            .enter().append("g")
            .attr("class","nodo");
//            .attr("r",0.01)
//            .attr("fill","black")
//            .transition()
    circle=visnodos.append("circle")
            .attr("class","cnodo")
//            .attr("transform",transform)
            .attr("r",function(d){return escalaradio(d.weight);})
            .style("fill",function(d){ return color(d.tipo);})
            .call(drag);
    
    //eventos de mouse sobre los elemntos graficos
     visnodos.on("mouseover", function(d) {	
            svg.style("cursor","pointer");
            div.transition()		
                .duration(200)		
                .style("opacity", .9);		
            div.html(d.nombre)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
            set_highlight(d);
            })
//        .on("mousedown", function(d) { 
//            d3.event.stopPropagation();
//            focus_node = d;
//            set_focus(d)
//            if (highlight_node === null) 
//                set_highlight(d)
//
//        })
        .on("mouseout", function(d) {		
            div.transition()		
                .duration(200)		
                .style("opacity", 0);
         exit_highlight(d);
        });
//    d3.select(window).on("mouseup",  
//    visnodos.on("mouseup",  
//		function() {
//		if (focus_node!==null)
//		{
//		 	focus_node = null;
//			if (highlight_trans<1)
//			{
//	
//		circle.style("opacity", 1);
////	  text.style("opacity", 1);
//	  visenlaces.style("opacity", 1);
//      nlabel.style("visibility","hidden");            
//	}
//		}
//	
//	if (highlight_node === null) exit_highlight();
//		});
    
            
     nlabel=visnodos.append("text")
    .attr("class","texto-nodo")
    .attr("dx", function(d){return escalaradio(d.weight);})
    .attr("dy", "1em")
    .style("visibility","hidden")
    .text(function(d) {return d.nombre;
//                      else if(d.tipo!="artista" && d.weight>50)
//                          return d.nombre;
                      })
//   .style("stroke", "gray");
//    .style("", "gray")
;
    
console.log("termina iniciar la fuerza");
    
}
    
//carga de los datos 
function cargardatos(url){    
d3.csv(url, function(error, data) {    
if (error) return console.warn(error);
    
datos=data; 
console.log("datos");    
preprocesarDatosExpoAgentes();
console.log("datos preprocesados"); 
//actualizarcarga(in_carga);    
iniciarfuerza();
console.log("fuerza inicada");
actualizarfcargas();  

    
});
}

function preprocesarDatosExpoAgentes(){
// computar los distintos nodos de los datos cargados
    //para cada enlace insertamos un nodo en la lista con el nombre y tipo del productor y otro para el
    //usuario y su tipo. Liego se guarda el enlace usando el nombre del proceso y el nombre del produtor
    //en el source y el del usuario en el target
//    datos.slice(0,500).forEach(function (d) {
    datos.forEach(function (d) {
      nodos.push({ "nombre": d.nombre_expo, tipo:"expo" });
      nodos.push({ "nombre": d.snombre_agente, tipo:tipoAgente(d.id_agente)});
      enlaces.push({ "source": d.nombre_expo,
                         "target": d.snombre_agente, "ano":d.ano 
                         });
     });
    
    
    var nodos_tmp=nodos;
    //agrupamos en un arrgelo los distintos nombres de los nodos sin repetir 
    var nombre_nodos = d3.keys(d3.nest()
       .key(function (d) { return d.nombre;})
       .map(nodos));
    //reemplazamos los valores de los nombre en source an target de los enlaces por 
    //el indice en el arrglego de nombres.
    enlaces.forEach(function (d, i) {
       enlaces[i].source = nombre_nodos.indexOf(enlaces[i].source);
       enlaces[i].target = nombre_nodos.indexOf(enlaces[i].target);
     });
    
    //A cada elemento del arreglo de nombres de los nodos se transforma en un objeto con el 
    //el nombre del nodo y un tipo indefinido. luego se completa la información del tipo con base en
    //la copia temporal de los nodos inicial.
    
    nombre_nodos.forEach(function (d, i) {
       nombre_nodos[i] = { "nombre": d , "tipo":"indefinido" };
       for (var j=0;j<nodos_tmp.length;j++){
        if(d == nodos_tmp[j].nombre)
            nombre_nodos[i].tipo=nodos_tmp[j].tipo;
       }
     }); 
    //actualizamos en la variable global
    nodos=nombre_nodos;  
    console.log("los enlaces");
    console.log(enlaces);
    console.log("los nodos");
    console.log(nodos);
    
}


function tick(){
 
//var q = d3.geom.quadtree(nodos),
//      i = 0,
//      n = nodos.length;
//
//  while (++i < n) q.visit(collide(nodos[i]));    

    
d3.selectAll(".cnodo").attr("cx",function(d){return translation[0]+ scaleFactor*d.x})
    .attr("cy",function(d){return translation[1]+ scaleFactor*d.y});

//d3.selectAll(".nodo circle")
    
visenlaces.attr("x1",function(d){return translation[0]+ scaleFactor*d.source.x;})
        .attr("y1",function(d){return translation[1]+ scaleFactor*d.source.y;})
        .attr("x2",function(d){return translation[0]+ scaleFactor*d.target.x;})
        .attr("y2",function(d){return translation[1]+ scaleFactor*d.target.y;});

d3.selectAll(".texto-nodo").attr("x", function (d) {
        return translation[0]+ scaleFactor*d.x;
    })
        .attr("y", function (d) {
        return translation[1]+ scaleFactor*d.y;
    });     
    
}

//funciones de visualización de eventos de usuario
//zoom+pan
function zum() {
  svgg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
//  svg.attr("transform", "translate(" + d3.event.translate + ")");    
}
function szum() {
    console.log("zoom", d3.event.translate, d3.event.scale);
    scaleFactor = d3.event.scale;
    translation = d3.event.translate;
    tick(); //update positions
}


function dragstarted(d){ 
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
    fuerza.stop(); //stop ticks while dragging
}
function dragged(d){
    if (d.fixed) return; //root is fixed
    
    //get mouse coordinates relative to the visualization
    //coordinate system:
    var mouse = d3.mouse(svgg.node());
    d.x = (mouse[0] - translation[0])/scaleFactor; 
    d.y = (mouse[1] - translation[1])/scaleFactor; 
            focus_node = d;
            set_focus(d)
            if (highlight_node === null) 
                set_highlight(d)

    tick();//re-position this node and any links
}
function dragended(d){
    d3.select(this).classed("dragging", false);
    fuerza.resume();
}

//on mouseover
function set_highlight(d)
{
	
	if (focus_node!==null) d = focus_node;
	highlight_node = d;

	if (highlight_color!="none")
	{
		  circle.style("stroke", function(o) {
                return isConnected(d, o) ? highlight_color : "none";});
          
//			text.style("font-weight", function(o) {
//                return isConnected(d, o) ? "bold" : "normal";});
        circle.style("stroke-width","2px")
            visenlaces.style("stroke", function(o) {
		      return o.source.index == d.index || o.target.index == d.index ? highlight_color :default_link_color;
                 

            });
        visenlaces.style("stroke-width",function(o) {
		      return o.source.index == d.index || o.target.index == d.index ? "2px" :"1px";
                 

            });
	}
}

function exit_highlight()
{
		highlight_node = null;
	if (focus_node===null)
	{
		svg.style("cursor","move");
		if (highlight_color!="none")
	{
  	  circle.style("stroke", "none");
//	  text.style("font-weight", "normal");
	  visenlaces.style("stroke", default_link_color);
      visenlaces.style("stroke-width","1px");     
      nlabel.style("visibility","hidden") ;   
 }
			
	}
}

function set_focus(d)
{	
if (highlight_trans<1)  {
    circle.transition()		
                .duration(200)
    .style("opacity", function(o) {
                return isConnected(d, o) ? 1 : highlight_trans;
            });
    
    nlabel.style("visibility", function(o) {
                return isConnectedElse(d, o)? "visible" : "hidden";
            });

//			text.style("opacity", function(o) {
//                return isConnected(d, o) ? 1 : highlight_trans;
//            });
			
            visenlaces.style("opacity", function(o) {
                return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
            });		
	}
}

//funciones de matriz de conectividad
function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

function hasConnections(a) {
		for (var property in linkedByIndex) {
				s = property.split(",");
				if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) 					return true;
		}
	return false;
	}

function isConnectedElse(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] && a.index != b.index;
    }


//funciones actualizar valor controles  
function actualizargravedad(sgravedad){
    fuerza.gravity(sgravedad);
//    console.log(sgravedad);
    fuerza.start();
    

}
function actualizarcarga(scarga){
    fuerza.charge(function(d){ var a=scarga*escalacarga(d.weight);return a;});
    console.log(scarga);
    fuerza.start();

}  
function actualizarfriccion(sfriccion){
    fuerza.friction(sfriccion);
//    console.log(scarga);
    fuerza.start();

}
function actualizarfcargas(){

    fuerza.charge(function(d){if(d.tipo!="individual")return escalacarga(d.weight);else return 0;})
          .linkDistance(distanciaEnlace)
          .linkStrength(rigidezEnlace)
          .start();
    
}

function control_recalentar(){
fuerza.start();
}

function filtrarXintervalo(n,l,yi,yf){

    
}

function seleccionado(artista){
    if(los44.indexOf(artista)!=-1)
        return "seleccionado";
        else
            return "artista";
    
    }

function esSeleccionado(artista){
    if(los44.indexOf(artista)!=-1)
        return true;
        else
            return false;
    
    }

function tipoAgente(id_agente){
    var tipoid=id_agente.split(".")[0];
    if(tipoid=="a")
            return "artista";
        else if(tipoid=="c")
                return "curador";
            else if(tipoid=="p")
                return "presentador";
                else if(tipoid=="au")
                    return "auspiciador";
                    else if(tipoid=="o")
                        return "obra";
    
}

function distanciaEnlace(l,i){
    if(l.target.tipo!="individual"){
        if(l.source.weight<l.target.weight) 
             return escalaenlaces(l.target.weight/l.source.weight);
         else
             return escalaenlaces(l.source.weight/l.target.weight);}
     else
         return height/100; 
}

function rigidezEnlace(l,i){
    if(l.target.tipo!="individual")
        return 0.5;
    else 
        return 1;
}

function collide(node) {
  var r = node.radius + 5,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = node.radius + quad.point.radius;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
}


function zoom() {
  d3.selectAll(".nodo").attr("transform", transform);
}

function transform(d) {
  return "translate(" + x(d[0]) + "," + y(d[1]) + ")";
}