customElements.define('hedron-p', class extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow( {mode: 'open'} );
        this.css = `<style>
        figure {
            display: inline-flex; justify-content: center; align-items: center;
            margin: 0;
            text-align: left;
            width: calc(var(--circumR)*var(--diameter)); height :calc(var(--circumR)*var(--diameter));
        }
        figure.extend {
            --inR: var(--extendR) !important;
        }
        div, svg {
            position: absolute;
            width: calc(var(--diameter)); height: calc(var(--diameter));
            overflow: visible;
            transform-style: preserve-3d;
        }
        use {
            stroke: hsl(var(--c),50%,50%); stroke-width: var(--stroke);
            fill: hsla(var(--c),80%,80%,0.85);
            transition: .5s;
        }
        div:nth-of-type(odd) {
            transform: translateZ(calc(var(--inR)*var(--diameter)/2));
        }
        div:nth-of-type(even) {
            transform: rotateY(180deg) translateZ(calc(var(--inR)*var(--diameter)/2));
        }
        div svg {
            transform-origin: 50% 50% calc(var(--diameter)*var(--inR)/-2);
            transform: rotate(var(--centerA)) rotateY(calc(-1*var(--slant)));
        }
        div:nth-of-type(n+3) svg {
            transform: rotate(calc(var(--centerA) + 36deg)) rotateY(calc(-1*var(--midSlant)));
        }
        figure[face='12'] svg {
            transform: rotate(var(--centerA)) rotateY(calc(1*var(--slant)));
        }
        figure[face='12'] svg:last-child {
            transform: rotate(36deg);
        }
        figure[face='6'] div svg {
            transform: rotate(calc(var(--centerA) - 45deg)) rotateX(45deg) rotateY(90deg);
        }
        figure[face='6'] > svg:first-of-type {
            transform: translateZ(calc(var(--inR)*var(--diameter)/2));
        }
        figure[face='6'] > svg:last-of-type, 
        figure[face='4'] > svg:last-of-type {
            transform: translateZ(calc(var(--inR)*var(--diameter)/-2));
        }
	figure + figure {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%); transform-style: preserve-3d;
        }</style>`;
    }
    get stroke() {
        return this.getAttribute('stroke');
    }
    get side() {
        return {20:3, 12:5, 8:3, 6:4, 4:3}[this.face];
    }
    get portion() {
        return {20:5, 12:6, 8:4, 6:4, 4:3}[this.face];
    }
    get around() {
        return {20:5, 12:5, 8:4, 6:4, 4:3}[this.face];
    }
    get elements() {
        const svg = document.createElement('svg');
        svg.innerHTML = `
        <defs>
            <polygon id=${this.side} points='${Gon.points(this.side)}'>
                <animate begin=indefinite fill=freeze attributeName=points dur='1000ms' />
            </polygon>
        </defs>`;
        
        const fillSVG = n => new Array(n).fill(`<svg><use href=#${this.side} /></svg>`).join('');
        const figure = document.createElement('figure');
        figure.innerHTML = new Array(Math.floor(this.face / this.portion)).fill(`<div>${fillSVG(this.portion)}</div>`).join('')
            + (fillSVG(this.face % this.portion) || '');
            
        figure.querySelectorAll('svg').forEach(svg => svg.setAttribute('viewBox', '-1,-1 2,2'));
        for (let i = 1; i <= this.around; i++)
            figure.querySelectorAll(`div svg:nth-child(${i})`).forEach(svg => svg.style.setProperty('--centerA', 360/this.around*i + 'deg'));
        
        this.color(figure);
        return svg.outerHTML + figure.outerHTML;
    }
    color(place) {
        place.querySelectorAll(`use`).forEach(gon => 
            gon.setAttribute('style', '--c:'+ (this.getAttribute('color') || Math.random()*360)) );
    }
    connectedCallback() {
        this.face = parseInt(this.getAttribute('face'));
        if (!this.face) return;
        this.shadow.innerHTML = this.css + this.elements;
        this.figure = this.shadow.querySelector('figure');
        this.figure.setAttribute('face', this.face);
        this.variables();
    }
    
    static get observedAttributes() {
        return ['stroke', 'diameter', 'color'];
    }
    variables(...others) {
        this.gon = new Gon(this.side, this.stroke);
        [
            ['--stroke', this.stroke],
            ['--diameter', this.getAttribute('diameter') + 'em'],
            ['--slant', (this.face==12? Math.PI - this.constant.foldA : this.constant.slant) + 'rad'],
            ['--inR', this.constant.inR*this.gon.side],
            ['--circumR', this.constant.circumR*this.gon.side],
            ['--extendR', this.gon.side/2/Math.cos(this.constant.foldA/2) + this.gon.normal*Math.tan(this.constant.foldA/2)],
            ['--edge', this.gon.side],
            (this.face==20? ['--midSlant', this.constant.foldA - this.constant.slant + 'rad'] : []),
            ...others
        ].forEach( ([p, v]) => this.figure.style.setProperty(p, v));
    }
    attributeChangedCallback(attr, before, after) {
        if (!this.figure) 
	    return this.connectedCallback();
        if (attr == 'color')
            return this.color(this.shadow);
        this.variables();
    }
    get constant() {
        let inR, circumR, foldA;
        if (this.face==20)
            [inR, circumR, foldA] = [(3*Math.sqrt(3) + Math.sqrt(15))/12, Math.sqrt(10 + 2*Math.sqrt(5))/4, Math.acos(Math.sqrt(5)/-3)];
        else if (this.face==12)
            [inR, circumR, foldA] = [Math.sqrt(250 + 110*Math.sqrt(5))/20, (Math.sqrt(15) + Math.sqrt(3))/4, Math.acos(Math.sqrt(5)/-5)];
        else if (this.face==8)
            [inR, circumR, foldA] = [Math.sqrt(6)/6, Math.sqrt(2)/2, Math.acos(1/-3)];
        else if (this.face==6)
            [inR, circumR, foldA] = [1/2, Math.sqrt(3)/2, Math.PI/2];
        else if (this.face==4)
            [inR, circumR, foldA] = [Math.sqrt(6)/12, Math.sqrt(6)/4, Math.acos(1/3)];
        return ({
            inR: inR,
            circumR: circumR,
            foldA: foldA,
            slant: Math.PI/2 - Math.asin(inR/circumR),
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
    get halfA()      {return Math.PI*(1-2/this.n)/2;}
    get centerA()    {return 2*Math.PI/this.n;}
    get normal()     {return this.r*Math.sin(this.halfA)+this.stroke/2;}
    get side()       {return this.normal/Math.tan(this.halfA)*2;}
    get strokedR()   {return this.normal/Math.sin(this.halfA);}
    get height()     {return this.strokedR*(1+Math.cos(this.centerA/2));}
    get truncatedR() {return this.r*Math.sin(this.halfA)/Math.sin(Math.PI-new Gon(this.n*2).centerA/2-this.halfA);}
}