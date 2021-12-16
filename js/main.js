/// A box is analogous to a bookmark group
/// data: { title: string, entries: [string] }
///
/// Each box gets a unique alphanumeric hash which is used for linking
/// a hidden radio element for opening/closing and the box itself

const box = data => {
    let t = $.h1()
    const hash = unique()
    return $.div(
        $.radio()
            .att$('name', `box`)
            .att$('id', `box${hash}`),
        format(data.title)($.label(t).wrap$(t))
            .map$(self => self.classList.add('title'))
            .att$('for', `box${hash}`)
            .click$(e => {
		// We don't open an empty box
                if (data.entries.length == 0) {
                    e.preventDefault()
                    return;
                }
		// Enable unchecking the radio element
                let r = e.currentTarget.previousElementSibling
                if (r.checked) {
                    r.checked = false;
                    e.preventDefault()
                }
            }),
        $.div(...data.entries.map(de => 
            format(de)($.div()).map$(self => self.classList.add('entry'))
        )).att$('class', 'entries')
    ).att$('class', 'box')
}

const colorPreview = () => $.div(...
                                [...Array(16).keys()] // = [0..16]
                                .map(x=>$.span()
                                    .click$(() => navigator.clipboard.writeText(`#{var(--color${x})}`))
                                    .att$('title', `#{var(--color${x})}`)
                                    .css$('background-color', `var(--color${x})`)
                            )).att$('class', 'swatches')

const db = window.localStorage

function validateJSON(str) {
    try {
        JSON.parse(str)
    } catch(e) {
        return e
    }
    return null
}

function unique(digits=6) {
    const toHexString = (dec) => (dec + Math.pow(16, digits)).toString(16).substr(-digits)
    const chars = Math.random().toString().repeat(digits).split('')
    const ret = chars.reduce((a,c)=>(((a << 5)-a)+c.charCodeAt(0))|0,0)
    return toHexString(ret)
}

function enforceProtocol(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return 'https://'+url
}

function format_date(d) {
    let delta = d - (new Date())
    let sign = ""
    if (delta < 0) {
        sign = "-"
        delta = -delta
    }
    delta /= 1000 // milliseconds -> seconds
    if (delta < 60) return `${sign}${Math.floor(delta)} seconds`
    delta /= 60 // seconds -> minutes
    if (delta < 60) return `${sign}${Math.floor(delta)} minutes`
    delta /= 60 // minutes -> hours
    if (delta < 24) return `${sign}${Math.floor(delta)} hours`
    delta /= 24 // hours -> days
    if (delta < 7) return `${sign}${Math.floor(delta)} days`
    if (delta < 30) return `${sign}${Math.floor(delta / 7)} weeks`
    if (delta < 365) return `${sign}${Math.floor(delta / 30)} months`
    delta /= 365 // days -> years
    return `${sign}${Math.floor(delta)} years`
}

function format(d) {
    const sigilMap = {
        '#' : color => el => el.map$(self => self.style.setProperty('--color', color)),
        '/' : href  => el => {
            let link = $.a().att$('href', enforceProtocol(href))
            el.ch$(link).wrap$(link)
        },
        '%' : url   => el => {
            let id = unique()
            let bar = $.searchbox(enforceProtocol(url))().att$('id', id).att$('size', 10)
            let lbl = $.label().att$('for', id)
            el.ch$(lbl, bar).wrap$(lbl)
        },
        '@' : time  => el => {
            let x = el.querySelector('h1') || el
            x.data$('time', format_date(new Date(time)))
        }
    }
    const modifiers = []
    const rawText = d.replace(/([#/%@])\{([^\}]+)\}/g, (_, sigil, bracket) => 
        modifiers.push(sigilMap[sigil](bracket))
        && '')
    return el => {
        modifiers.forEach(f => f(el))
        el.ch$(rawText)
        return el
    }
}

function updateDB(iBoxes, iSplash, then) {
    if (iSplash) {
        splash.src = iSplash
        db.setItem('splash', iSplash)
    }
    if (!iBoxes) { alert('no boxes submitted!'); return; }
    const err = validateJSON(iBoxes)
    if (err) {
        alert('Couldn\'t parse\nYou must submit valid JSON')
    } else {
        db.setItem('boxes', iBoxes)
        boxes.replaceWith(
            $.div(...JSON.parse(iBoxes).map(box))
                .att$('id', 'boxes')
        )
        then()
    }
}

const icon = content => $.i().data$('icon', content).map$(el => el.classList.add('icon'))

document.addEventListener("DOMContentLoaded", ()=>{
    let dbboxes = db.getItem('boxes') || "[\n\n]"
    if (db.getItem('dark') === 'true') {
        document.documentElement.toggleAttribute('dark')
    }
    const iLayout = $.editor()
    const iSplash = $.input().att$('type', 'text')
    const settings = $.overlay().att$('id', 'settingsOverlay')
    settings.ch$(
        $.div(
            $.tabs({
                'Boxes': $.div(
                    iLayout,
                    colorPreview()
                      .css$('display', 'flex')
                      .css$('border','solid 1px black')
                    ).att$('id', 'settingsBoxes'),
                'Theme': $.div(
                    $.label('Picture: ').att$('for', 'iSplash'),
                    iSplash.att$('id', 'iSplash').att$('name', 'iSplash')
                    )
            }),
            $.div(
                $.button('Import')
                    .click$(()=>{
                        const input = $.input().att$('type', 'file').att$('accept', '.json')
                        input.click()
                        input.addEventListener('change', ()=> {
                            console.log('aaaaa')
                            input.files[0].text().then(str => updateDB(str, settings.toggle$))
                        })
                    }),
                $.button('Export')
                    .click$(e => {
                        const data = db.getItem('boxes')
                        const filename = `startpage-${(new Date()).toISOString().split('T')[0]}.json`
                        $.a()
                            .att$('download', filename)
                            .att$('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
                            .click()
                    }),
                $.button('Cancel')
                    .click$(settings.toggle$),
                $.button('Save')
                    .click$(() => updateDB(iLayout.value, iSplash.value, settings.toggle$))
            ).att$('id', 'settingsBtns')
        ).att$('id', 'settings')
    )
    body.appendChild(
    $.main(
        $.button('LIGHT/DARK')
            .att$('id', 'darkmode')
            .click$(() => {
                document.documentElement.toggleAttribute('dark')
                if (document.documentElement.hasAttribute('dark'))
                    db.setItem('dark', 'true')
                else 
                    db.setItem('dark', 'false')
            }),
        $.button('SETTINGS')
            .att$('id', 'settingsOpen')
            .click$(() => {
                tabs.switchTo(0)
                settings.querySelector('textarea')?.map$(t => t.value = db.getItem('boxes'))
                settings.querySelector('input[type="text"]')?.map$(e => e.value = db.getItem('splash'))
                settings.toggle$()
            }),
        $.div(
            $.img()
                .att$('id', 'splash')
                .att$('src', db.getItem('splash')),
            $.div(...JSON.parse(dbboxes)
		  .map(box)
		  .map((b, i) => b.map$(
		      e=>e.querySelector('.title').style.setProperty('--color', `var(--color${i%14+2})`)))
		 ).att$('id', 'boxes')
        ).att$('id', 'content'),
        settings
    ))
})
