customElements.define('hedron-p', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow( {mode: 'open'} );
        this.common = `
        figure {
            display: inline-flex; justify-content: center; align-items: center;
            margin: 0;
            text-align: left;
            width: calc(var(--extend)*var(--diameter)); height :calc(var(--extend)*var(--diameter));
            --stroke-percent: calc(var(--stroke)*100%);
        }
        div, svg {
            position: absolute;
            width: var(--diameter); height: var(--diameter);
            overflow: visible;
            transform-style: preserve-3d;
        }
        polygon {
            stroke: hsl(var(--c),50%,50%); stroke-width: var(--stroke);
            fill: hsla(var(--c),80%,80%,0.75);
        }
        .vertex-1 {
            transform: translateZ( calc(var(--extend)*var(--diameter)/-2) );
        }
        .vertex-2 {
            transform: rotateY(180deg) translateZ( calc(var(--extend)*var(--diameter)/-2) );
        }
        figure[class="3-gon"] div[class|=vertex] svg {
            right: calc(50% + var(--stroke-percent)/2);
            transform-origin: calc(100% + var(--stroke-percent)/2) 50%;
            transform: rotate(var(--r)) rotate3d(0,1,0,var(--slant));
        }`;
    }
    elements() {
        const figure = document.createElement('figure');
        if (this.face != 12)
            figure.classList.add('3-gon');
        const faces = {20:5, 12:6, 8:4, 4:3};
        ['vertex-1', ...this.face > 4 ? ['vertex-2', ...this.face == 20 ? ['middle-1', 'middle-2']:[] ]:[] ].forEach(group =>
            figure.innerHTML += `<div class=${group}>${new Array(faces[this.face]).fill('<svg><polygon/></svg>').join('')}</div>
                ${this.face == 4 ? '<svg><polygon/></svg>':''}`);

        Gon.points(this.face == 12 ? 5:3, figure, this.getAttribute('color'));
        figure.querySelectorAll('svg').forEach(svg => svg.setAttribute('viewBox', '-1,-1 2,2'));
        return figure.outerHTML;
    }
    variables(...others) {
        [
            ['--stroke', this.getAttribute('stroke')],
            ['--diameter', this.getAttribute('diameter')],
            ...others
        ].forEach( ([p, v]) => this.shadow.querySelector('figure').style.setProperty(p, v));
    }
    vertex(n) {
        return new TriangleVertex(n, this.getAttribute('stroke'), this.shadowRoot);
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
                    transform: translateZ( calc(var(--widen)*var(--diameter)/2) );
                }
                .middle-2 {
                    transform: rotateY(180deg) translateZ( calc(var(--widen)*var(--diameter)/2) );
                }
                div[class|=middle] svg {
                    left: calc(25% + var(--stroke-percent)/4);
                    transform-origin: calc(25% - var(--stroke-percent)/4) 50%;
                    transform: rotate(var(--r)) translateX( calc(var(--diameter)/2*var(--normal)) ) rotate3d(0,1,0,var(--midSlant));
                }</style>`;
                this.attributeChangedCallback();
                break;
            case 8:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}</style>`;
                this.attributeChangedCallback();
                break;
            case 4:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}
                svg:only-of-type {
                    transform: translateZ( calc( (var(--height) - var(--extend))*var(--diameter)/2 ) ); 
                }</style>`;
                this.attributeChangedCallback();
                break;
            case 12:
                this.shadow.innerHTML = this.elements() + `
                <style>${this.common}
                figure {
                    width: calc(var(--circumradius)*var(--diameter)); height: calc(var(--circumradius)*var(--diameter));
                }
                svg:not(:last-child) {
                    transform-origin: var(--originX) var(--originY);
                    transform: rotate3d(var(--vectorX), calc(-1*var(--vectorY)), 0, calc(-1*var(--slant))) rotate(108deg);
                }</style>`;
                this.attributeChangedCallback();
                break;
        }
    }
    static get observedAttributes() {
        return ['stroke', 'diameter'];
    }
    attributeChangedCallback() {
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
                    ['--normal', vertex.normal],
                    ['--slant', vertex.slant + 'rad'],
                    ['--extend', vertex.height]);
                break;
            case 4:
                vertex = this.vertex(3);
                this.variables(
                    ['--slant', vertex.slant + 'rad'],
                    ['--height', vertex.height],
                    ['--extend', (Math.pow(vertex.tri.strokedRadius, 2) + Math.pow(vertex.height, 2)) / 2 / vertex.height]);
                break;
            case 12:
                const penta = new Gon(5, this.getAttribute('stroke'));

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
                    ['--circumradius', Math.pow((Math.pow(PENTA.strokedRadius * PENTA.scale, 2) + Math.pow(bigPentaToCenter, 2)), 1/2)]);
                break;
        }
        this.setAttribute('circumradius', window.getComputedStyle(this.shadow.querySelector('figure')).width);
    }
});
class Gon {
    constructor(n,stroke) {
        this.n=n;
        this.stroke=parseFloat(stroke);
    }
    static points(n,place,color) {
        place.querySelectorAll(`polygon`).forEach(gon=>{
            gon.setAttribute('points', [...Array(n).keys()].map(i=> [Math.cos(2*Math.PI/n*i), Math.sin(2*Math.PI/n*i)] ).flat().join(' '));
            gon.setAttribute('style', '--c:'+ (color||Math.random()*360)); 
        });
    }
    get halfAngle()   {return Math.PI*(1-2/this.n)/2;}
    get centerAngle() {return 2*Math.PI/this.n;}
    get normal()  {return Math.sin(this.halfAngle)+this.stroke/2;}
    get side()    {return this.normal/Math.tan(this.halfAngle)*2;}
    get strokedRadius() {return this.normal/Math.sin(this.halfAngle);}
    get height()  {return this.strokedRadius*(1+Math.cos(this.centerAngle/2));}
}
class TriangleVertex {
    constructor(n,stroke,place) {
        this.n=n;
        this.tri=new Gon(3,stroke);
        for (let i=1;i<=n;i++)
            place.querySelectorAll(`svg:nth-child(${i})`).forEach(svg=>svg.style.setProperty('--r',360/n*i+'deg'));
    }
    get normal()    {return this.tri.side/2/Math.tan(2*Math.PI/this.n/2);}
    get radius()    {return this.tri.side/2/Math.sin(2*Math.PI/this.n/2);}
    get slant()     {return Math.acos(this.normal/this.tri.height);}
    get height()    {return Math.sin(this.slant)*this.tri.height;}
    get midSlant()  {return Math.acos((this.radius-this.normal)/this.tri.height);}
    get midHeight() {return Math.sin(this.midSlant)*this.tri.height;}
}
