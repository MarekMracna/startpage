const el = tagName => (...children) => {
    let node = document.createElement(tagName)
    node.att$ = function(name,value) {
        this.setAttribute(name,value)
        return this
    }
    node.ch$ = function(...children) {
        for (let ch of children){
            if (typeof(ch) === 'string') {
                ch = document.createTextNode(ch)
            }
            this.appendChild(ch)
        }
        return this
    }
    node.on$ = function(event, handler) {
        this.addEventListener(event, handler)
        return this
    }
    node.data$ = function(name, value) {
        this.dataset[name] = value
        return this
    }
    node.css$ = function(prop, value) {
        this.style[prop] = value
        return this
    }
    node.click$ = function(handler) {
        this.addEventListener('click', handler)
        return this
    }
    node.map$ = function(handler) {
        handler(this)
        return this
    }
    node.wrap$ = function(el) {
        this.ch$ = this.ch$.bind(el)
        return this
    }
    node.return$ = x => x
    node.ch$(...children)
    return node
}

const fmap = a => f => (...args) => f(a(...args))

const HTML_TAGS = 'main section div span a button img ul ol li h1 h2 h3 h4 h5 h6 p form input label textarea i'

$ = []
HTML_TAGS.split(' ').forEach(tag => $[tag] = el(tag))

$.radio     = fmap($.input)(e=>e.att$('type','radio'))
$.checkbox  = fmap($.input)(e=>e.att$('type','checkbox'))
$.overlay   = fmap($.div)(e=>
    e.map$(o=>o.toggle$ = function(){o.toggleAttribute('hidden')})
     .att$('hidden', true)
     .css$('position', 'fixed')
     .css$('width', '100%')
     .css$('height', '100%')
)
$.searchbox = url => fmap($.input)(e=>
    e.att$('type', 'search')
     .on$('keyup', ev => ev.keyCode===13 && (window.location.href = url+e.value))
)
$.editor    = fmap($.textarea)(e=>e.on$('keydown', function(e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
}))
$.tabs      = ts => {
    let btns = $.div()
    let tabs = Object.getOwnPropertyNames(ts)
    let ret = $.div(btns, ts[tabs[0]]).att$('id', 'tabs')
    ret.tabs = ts
    ret.switchTo = num => btns.children[num].click()
    for (t in ts) {
        btns.ch$(
            $.button(t)
                .map$(el=>el.tab = ret.tabs[t])
                .click$(e => {
                    let el = e.currentTarget
                    if (el.tab != ret.lastElementChild)
                        ret.replaceChild(el.tab, ret.lastElementChild)
                })
                
        )
    }
    return ret
}