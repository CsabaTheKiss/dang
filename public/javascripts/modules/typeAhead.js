import axios from 'axios';
// getting rid of possible hacking of the DOM:
// for example adding html img tag to the store with onload property:
// could load any nasty JS code - this one get's rid of these on supplied HTML
import dompurify from 'dompurify';

const UP_KEY = 38;
const DOWN_KEY = 40;
const ENTER_KEY = 13;

function searchResultsHTML(stores) {
    return stores.map(store => {
        return `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `;
    }).join('');
}

function typeAhead(search) {
    if (!search) return;

    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function() {
        // if there's no value, quit it!
        if (!this.value) {
            searchResults.style.display = 'none';
            return; // stop
        }

        // show the search results
        searchResults.style.display = 'block';

        axios
            .get(`/api/search?q=${this.value}`)
            .then(res => { 
                if (res.data.length) {
                    console.log('There is something to show!');
                    searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
                    return;
                }
                // tell them nothing came back
                searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value}</div>`);
            })
            .catch(err => {
                console.error('[typeAhead.js] There was an error fetching results', err);
            });
    });

    // handle keyup inputs
    searchInput.on('keyup', (e) => {
        // if not arrow keys, return
        if (![DOWN_KEY, UP_KEY, ENTER_KEY].includes(e.keyCode)) {
            return;
        }
        const activeClass = 'search__result--active';
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;
        if (e.keyCode === DOWN_KEY && current) {
            next = current.nextElementSibling || items[0]; // if no next element, fall back to the first
        } else if (e.keyCode === DOWN_KEY) {
            next = items[0];
        } else if (e.keyCode === UP_KEY && current) {
            next = current.previousElementSibling || items[items.length - 1]; // if no next element, fall back to the last
        } else if (e.keyCode === UP_KEY) {
            next = items[items.length - 1];
        } else if (e.keyCode === ENTER_KEY && current.href) {
            window.location = current.href;
            return; // stop function from running
        }

        console.log(next);
        if (current) {
            current.classList.remove(activeClass);
        }
        next.classList.add(activeClass);
    });
}

export default typeAhead;