customElements.define('hedron-p', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow( {mode: 'open'} );
        this.common = `
        figure {
            display: inline-flex; justify-content: center; align-items: center;
            margin: 0;
            text-align: left;
            width: calc(var(--extend)*var(--diameter)*1em); height :calc(var(--extend)*var(--diameter)*1em);
        }
        div, svg {
            position: absolute;
            width: calc(var(--diameter)*1em); height: calc(var(--diameter)*1em);
            overflow: visible;
            transform-style: preserve-3d;
        }
        use {
            stroke: hsl(var(--c),50%,50%); stroke-width: var(--stroke);
            fill: hsla(var(--c),80%,80%,0.85);
            transition:1s;
        }
        .vertex-1 {
            transform: translateZ( calc(var(--extend)*var(--diameter)*1em/-2) );
        }
        .vertex-2 {
            transform: rotateY(180deg) translateZ( calc(var(--extend)*var(--diameter)*1em/-2) );
        }
        .vertex div[class|=vertex] svg {
            right: calc(50% * var(--radius));
            transform-origin: calc(50%*(1 + var(--radius))) 50%;
            transform: rotate(var(--r)) rotate3d(0,1,0,var(--slant));
        }`;
    }
    get stroke() {
        return this.getAttribute('stroke');
    }
    get side() {
        return {20:3, 12:5, 8:3, 6:4, 4:3}[this.face];
    }
    color(place) {
        place.querySelectorAll(`use`).forEach(gon => 
            gon.setAttribute('style', '--c:'+ (this.getAttribute('color') || Math.random()*360)) );
    }
    elements() {
        const svg = document.createElement('svg');
        svg.innerHTML += `<defs><polygon id=${this.side}><animate begin=indefinite fill=freeze attributeName=points dur='1000ms' /></polygon></defs>`;
        svg.querySelector('polygon').setAttribute('points', Gon.points(this.side));
        
        const figure = document.createElement('figure');
        const faces = {20:5, 12:6, 8:4, 6:3, 4:3};
        ['vertex-1', ...this.face > 4 ? ['vertex-2', ...this.face == 20 ? ['middle-1', 'middle-2']:[] ]:[] ].forEach(group =>
            figure.innerHTML += `<div class=${group}>${new Array(faces[this.face]).fill(`<svg><use href=#${this.side} /></svg>`).join('')}</div>
                ${this.face == 4 ? '<svg><use href=#3 /></svg>':''}`);

        this.color(figure);
        figure.querySelectorAll('svg').forEach(svg => svg.setAttribute('viewBox', '-1,-1 2,2'));
        
        return svg.outerHTML + figure.outerHTML;
    }
    connectedCallback() {
        let vertex;
        this.face = parseInt(this.getAttribute('face'));
        switch (this.face) {
            case 20:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}
                figure {
                    --widen: calc(var(--midHeight)/2);
                    --extend: calc(var(--widen) + var(--height));
                }
                .middle-1 {
                    transform: translateZ( calc(var(--widen)*var(--diameter)*1em/2) );
                }
                .middle-2 {
                    transform: rotateY(180deg) translateZ( calc(var(--widen)*var(--diameter)*1em/2) );
                }
                div[class|=middle] svg {
                    left: calc(25%*(1 + var(--stroke)));
                    transform-origin: calc(25%*(1 - var(--stroke))) 50%;
                    transform: rotate(var(--r)) translateX( calc(var(--diameter)*1em/2*var(--normal)) ) rotate3d(0,1,0,var(--midSlant));
                }</style>`;
                break;
            case 6:
            case 8:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}</style>`;
                break;
            case 4:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}
                svg:only-of-type {
                    transform: translateZ( calc( (var(--height) - var(--extend))*var(--diameter)*1em/2 ) ); 
                }</style>`;
                break;
            case 12:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}
                figure {
                    width: calc(var(--circumradius)*var(--diameter)*1em); height: calc(var(--circumradius)*var(--diameter)*1em);
                }
                svg:not(:last-child) {
                    transform-origin: var(--originX) var(--originY);
                    transform: rotate3d(var(--vectorX), calc(-1*var(--vectorY)), 0, calc(-1*var(--slant))) rotate(108deg);
                }</style>`;
                break;
        }
        this.attributeChangedCallback();
    }
    
    static get observedAttributes() {
        return ['stroke', 'diameter', 'color', 'truncate'];
    }
    vertex(n) {
        this.shadowRoot.querySelector('figure').classList.add('vertex');
        return new Vertex(n, this.stroke, this.shadowRoot, this.face==6);
    }
    variables(...others) {
        [
            ['--stroke', this.stroke],
            ['--diameter', this.getAttribute('diameter')],
            ...others
        ].forEach( ([p, v]) => this.shadow.querySelector('figure').style.setProperty(p, v));
    }
    attributeChangedCallback(attr,before,after) {
        if (attr=='color')
            return this.color(this.shadow);
        if (attr=='truncate')
            return this.truncate(after);
        let vertex;
        switch (this.face) {
            case 20:
                vertex = this.vertex(5);
                this.variables(
                    ['--normal', vertex.normal],
                    ['--slant', vertex.slant + 'rad'],
                    ['--height', vertex.height],
                    ['--midSlant', vertex.midSlant + 'rad'],
                    ['--midHeight', vertex.midHeight]);
                break;
            case 8:
                vertex = this.vertex(4);
                this.variables(
                    ['--slant', vertex.slant + 'rad'],
                    ['--extend', vertex.height]);
                break;
            case 4:
                vertex = this.vertex(3);
                this.variables(
                    ['--slant', vertex.slant + 'rad'],
                    ['--height', vertex.height],
                    ['--extend', (Math.pow(vertex.gon.strokedRadius, 2) + Math.pow(vertex.height, 2)) / 2 / vertex.height]);
                break;
            case 12:
                const penta = new Gon(5, this.stroke);

                for (let i = 0; i <= 4; i++) {
                    const [x, y] = [Math.cos(penta.centerAngle * i), Math.sin(penta.centerAngle * i)];
                    [
                        ['--originX', (x * penta.strokedRadius / 2 + 0.5) * 100 + '%'],
                        ['--originY', (y * penta.strokedRadius /-2 + 0.5) * 100 + '%'],
                        ['--vectorX', Math.cos(penta.centerAngle * (i + 1)) - x],
                        ['--vectorY', Math.sin(penta.centerAngle * (i + 1)) - y]
                    ].forEach( ([p, v]) =>
                        this.shadowRoot.querySelectorAll(`svg:nth-child(${i+1})`).forEach(svg => svg.style.setProperty(p, v)));
                }
                
                penta.diagonal = penta.side * Math.cos(Math.PI * (1 - 3 / 5) / 2) * 2;
                const PENTA = new Gon(5,0);
                PENTA.scale = penta.diagonal / PENTA.side;
                penta.heightToDiagonal = penta.side * Math.cos(Math.PI * (3 / 5 - 1 / 2));
                
                let vertexSlant = Math.acos((PENTA.normal * PENTA.scale - penta.normal) / penta.heightToDiagonal);
                let extend = (penta.height + penta.heightToDiagonal) * Math.sin(vertexSlant) / -2;
                let bigPentaToCenter = extend + penta.height * Math.sin(vertexSlant);

                this.variables(
                    ['--slant', vertexSlant + 'rad'],
                    ['--extend', extend],
                    ['--circumradius', Math.pow(Math.pow(PENTA.strokedRadius * PENTA.scale, 2) + Math.pow(bigPentaToCenter, 2), 1/2)]);
                break;
            case 6:
                vertex = this.vertex(3);
                const square = new Gon(4, this.stroke);
                const TRI = new Gon(3,0);
                TRI.scale = 2 / TRI.side;
                this.variables(
                    ['--slant', Math.acos(TRI.scale/2) + 'rad'],
                    ['--extend', Math.pow(Math.pow(square.strokedRadius*2,2) + Math.pow(square.side,2), 1/2) / 2]);
                break;
        }
    }
    truncate(level) {
        this.shadow.querySelectorAll('polygon').forEach(gon => {
            let points;
            const side = parseInt(gon.id);
            if (level=='none') 
                points = Gon.points(side);
            if (level=='semi') 
                points = Gon.points(side*2, new Gon(side).truncatedRadius, Math.PI/side/-2);
            if (level=='full') {
                const r = new Gon(side, this.stroke).normal;
                points = Gon.points(side, r - (new Gon(side, this.stroke, r).strokedRadius - r), -Math.PI/side, true);
            }
            const animate = gon.querySelector('animate');
            animate.setAttribute('from', animate.getAttribute('to') || animate.parentNode.getAttribute('points'));
            animate.setAttribute('to', points);
            animate.beginElement();
        });
    }
});
class Gon {
    constructor(n,stroke=0,r=1) {
        this.n=n;
        this.r=r;
        this.stroke=parseFloat(stroke);
    }
    static points(n,r=1,start=0,alt=false) {
        const point=i=>[Math.cos(2*Math.PI/n*i+start), Math.sin(2*Math.PI/n*i+start)].map(c=>Math.round(c*r*100000)/100000);
        const points=[...Array(n).keys()].map(i=> [...point(i), ... n<6? point(i):[] ] ).flat();
        return (alt? [...points.slice(2),...points.slice(0,2)] : points).join(' ');
    }
    get halfAngle()   {return Math.PI*(1-2/this.n)/2;}
    get centerAngle() {return 2*Math.PI/this.n;}
    get normal()  {return this.r*Math.sin(this.halfAngle)+this.stroke/2;}
    get side()    {return this.normal/Math.tan(this.halfAngle)*2;}
    get strokedRadius() {return this.normal/Math.sin(this.halfAngle);}
    get height()  {return this.strokedRadius*(1+Math.cos(this.centerAngle/2));}
    get truncatedRadius() {return this.r*Math.sin(this.halfAngle)/Math.sin(Math.PI-new Gon(this.n*2).centerAngle/2-this.halfAngle);}
}
class Vertex {
    constructor(n,stroke,place,square) {
        this.n=n;
        this.gon=new Gon(square? 4:3,stroke);
        place.querySelector('figure').style.setProperty('--radius',this.gon.strokedRadius);
        for (let i=1;i<=n;i++)
            place.querySelectorAll(`svg:nth-child(${i})`).forEach(svg=>svg.style.setProperty('--r',360/n*i+'deg'));
    }
    get normal()    {return this.gon.side/2/Math.tan(2*Math.PI/this.n/2);}
    get radius()    {return this.gon.side/2/Math.sin(2*Math.PI/this.n/2);}
    get slant()     {return Math.acos(this.normal/this.gon.height);}
    get height()    {return Math.sin(this.slant)*this.gon.height;}
    get midSlant()  {return Math.acos((this.radius-this.normal)/this.gon.height);}
    get midHeight() {return Math.sin(this.midSlant)*this.gon.height;}
}
