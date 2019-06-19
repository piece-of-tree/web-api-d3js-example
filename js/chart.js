function display(id, data) {

    const barColor = '#e57373';

    function setSegmentColor(color) { 
        return {low: "#9fa8da", mid: "#80cbc4",high: "#ffe082"}[color]; 
    }
        
    data.forEach(d => d.total = d.freq.low + d.freq.mid + d.freq.high);
    
    function histogram(freq) {

        const hG={}
        const hGDim = {t: 60, r: 0, b: 30, l: 0};

        hGDim.w = 500 - hGDim.l - hGDim.r, 
        hGDim.h = 300 - hGDim.t - hGDim.b;
        
        const hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        const x = d3.scale.ordinal()
                    .rangeRoundBands([0, hGDim.w], 0.1)
                    .domain(freq.map(d => d[0]));
        
        hGsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + hGDim.h + ")")
            .call(d3.svg.axis().scale(x).orient("bottom"));

        const y = d3.scale.linear().range([hGDim.h, 0]).domain([0, d3.max(freq, d => d[1])]);       
        const bars = hGsvg.selectAll(".bar").data(freq).enter().append("g").attr("class", "bar");
        
        bars.append("rect")
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d[1]))
            .attr("width", x.rangeBand())
            .attr("height", d => hGDim.h - y(d[1]))
            .attr('fill',barColor)
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
        
        bars.append("text").text(d => d3.format(",")(d[1]))
            .attr("x", d => x(d[0]) + x.rangeBand() / 2)
            .attr("y", d => y(d[1]) - 5)
            .attr("text-anchor", "middle");
        
        function mouseover(d) {  
            
            const st = data.filter(s => s.State == d[0])[0],
                nD = d3.keys(st.freq).map(s => ({type:s, freq:st.freq[s]}));

            pC.update(nD);
            leg.update(nD);
        }
        
        function mouseout() { 
            pC.update(tF);
            leg.update(tF);
        }
        
        hG.update = (nD, color) => {

            const bars = hGsvg.selectAll(".bar").data(nD);
            
            y.domain([0, d3.max(nD, d => d[1])]);
            
            bars.select("rect").transition().duration(500)
                .attr("y", d => y(d[1]))
                .attr("height", d => hGDim.h - y(d[1]))
                .attr("fill", color);

            bars.select("text").transition().duration(500)
                .text(d => d3.format(",")(d[1]))
                .attr("y", d => y(d[1])-5);            
        }

        return hG;
    }
    
    
    function pieChart(pD) {

        const pC ={}
        const pieDim ={w: 250, h: 250};

        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;       
        
        const piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");
        
        const arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);    
        const pie = d3.layout.pie().sort(null).value(d => d.freq);
        
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", d => setSegmentColor(d.data.type))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        
        pC.update = nD => {
            piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                .attrTween("d", arcTween);
        }        
        
        function mouseover(d) {
            hG.update(data.map(v => { 
                return [v.State,v.freq[d.data.type]];}),setSegmentColor(d.data.type));
        }
        
        function mouseout(d) {
            hG.update(data.map(v => [v.State,v.total]), barColor);
        }
        
        
        function arcTween(a) {
            const i = d3.interpolate(this._current, a);
            this._current = i(0);
            return t => arc(i(t));
        }

        return pC;
    }
    
    function legend(lD) {

        const leg = {};   
        const legend = d3.select(id).append("table").attr('class','legend');
               
        const tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
            
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
            .attr("width", '16').attr("height", '16')
            .attr("fill", d => setSegmentColor(d.type));
            
        tr.append("td").text(d => d.type);
        tr.append("td").attr("class",'legendFreq').text(d => d3.format(",")(d.freq));
        tr.append("td").attr("class",'legendPerc').text(d => getLegend(d,lD));

        leg.update = nD => {
            
            const l = legend.select("tbody").selectAll("tr").data(nD);

            l.select(".legendFreq").text(d => d3.format(",")(d.freq));
            l.select(".legendPerc").text(d => getLegend(d,nD));        
        }
        
        function getLegend(d,aD) { 
            return d3.format("%")(d.freq/d3.sum(aD.map(v => v.freq)));
        }

        return leg;
    }
    
    const tF = ['low','mid','high'].map(d => { 
        return {type:d, freq: d3.sum(data.map(t => t.freq[d]))}; 
    });    
    
    const sF = data.map(d => [d.State,d.total]);

    const hG = histogram(sF);
    const pC = pieChart(tF);
    const leg= legend(tF);
}