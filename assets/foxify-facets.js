class FoxifyFacetFiltersForm extends HTMLElement {
	constructor() {
		super();
		this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

		this.debouncedOnSubmit = window.Foxify.Utils.debounce((event) => {
			this.onSubmitHandler(event);
		}, 500);

		const facetForm = this.querySelector('form');
		facetForm.addEventListener('input', this.debouncedOnSubmit.bind(this));

	}

	static setListeners() {
		const onHistoryChange = (event) => {
			const searchParams = event.state ? event.state.searchParams : FoxifyFacetFiltersForm.searchParamsInitial;
			if (searchParams === FoxifyFacetFiltersForm.searchParamsPrev) return;
			FoxifyFacetFiltersForm.renderPage(searchParams, null, false);
		}
		window.addEventListener('popstate', onHistoryChange);
	}

	static toggleActiveFacets(disable = true) {
		document.querySelectorAll('.js-facet-remove').forEach((element) => {
			element.classList.toggle('disabled', disable);
		});
	}

	static renderPage(searchParams, event, updateURLHash = true) {
		FoxifyFacetFiltersForm.searchParamsPrev = searchParams;
		const sections = FoxifyFacetFiltersForm.getSections();
		const countContainer = document.querySelector('#ProductCount');
		document.querySelector('#ProductGridContainer').classList.add('loading');
		if (countContainer){
			countContainer.classList.add('loading');
		}
		sections.forEach((section) => {
			const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
			const filterDataUrl = element => element.url === url;

			FoxifyFacetFiltersForm.filterData.some(filterDataUrl) ?
				FoxifyFacetFiltersForm.renderSectionFromCache(filterDataUrl, event) :
				FoxifyFacetFiltersForm.renderSectionFromFetch(url, event);
		});

		if (updateURLHash) FoxifyFacetFiltersForm.updateURLHash(searchParams);
	}

	static renderSectionFromFetch(url, event) {
		fetch(url)
			.then(response => response.text())
			.then((responseText) => {
				const html = responseText;
				FoxifyFacetFiltersForm.filterData = [...FoxifyFacetFiltersForm.filterData, { html, url }];
				FoxifyFacetFiltersForm.renderFilters(html, event);
				FoxifyFacetFiltersForm.renderProductGridContainer(html);
				FoxifyFacetFiltersForm.renderProductCount(html);
			});
	}

	static renderSectionFromCache(filterDataUrl, event) {
		const html = FoxifyFacetFiltersForm.filterData.find(filterDataUrl).html;
		FoxifyFacetFiltersForm.renderFilters(html, event);
		FoxifyFacetFiltersForm.renderProductGridContainer(html);
		FoxifyFacetFiltersForm.renderProductCount(html);
	}

	static renderProductGridContainer(html) {
		const ProductGridContainer = document.querySelector('#ProductGridContainer')
		ProductGridContainer.innerHTML = new DOMParser().parseFromString(html, 'text/html').querySelector('#ProductGridContainer').innerHTML;
		ProductGridContainer.classList.remove('loading');
	}

	static renderProductCount(html) {
		const count = new DOMParser().parseFromString(html, 'text/html').querySelector('#ProductCount').innerHTML
		const container = document.querySelector('#ProductCount');
		container.innerHTML = count;
		container.classList.remove('loading');
	}

	static renderFilters(html, event) {
		const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

		const facetDetailsElements =
			parsedHTML.querySelectorAll('#FoxifyFacetFiltersForm .js-filter');
		const matchesIndex = (element) => {
			const jsFilter = event ? event.target.closest('.js-filter') : undefined;
			return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
		}
		const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
		const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

		facetsToRender.forEach((element) => {
			document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
		});

		FoxifyFacetFiltersForm.renderActiveFacets(parsedHTML);
		// FoxifyFacetFiltersForm.renderAdditionalElements(parsedHTML);

		if (countsToRender) FoxifyFacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
	}

	static renderActiveFacets(html) {
		const activeFacetElementSelectors = ['.f\\:active-facets'];

		activeFacetElementSelectors.forEach((selector) => {
			const activeFacetsElement = html.querySelector(selector);
			if (!activeFacetsElement) return;
			document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
		})

		FoxifyFacetFiltersForm.toggleActiveFacets(false);
	}

	static renderAdditionalElements(html) {
		const mobileElementSelectors = ['.mobile-f\\:facets__open', '.mobile-f\\:facets__count', '.sorting'];

		mobileElementSelectors.forEach((selector) => {
			if (!html.querySelector(selector)) return;
			document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
		});

		document.getElementById('FoxifyFacetFiltersFormMobile').closest('menu-drawer').bindEvents();
	}

	static renderCounts(source, target) {
		const targetElement = target.querySelector('.f\\:facets__selected');
		const sourceElement = source.querySelector('.f\\:facets__selected');

		const targetElementAccessibility = target.querySelector('.f\\:facets__summary');
		const sourceElementAccessibility = source.querySelector('.f\\:facets__summary');

		if (sourceElement && targetElement) {
			target.querySelector('.f\\:facets__selected').outerHTML = source.querySelector('.f\\:facets__selected').outerHTML;
		}

		if (targetElementAccessibility && sourceElementAccessibility) {
			target.querySelector('.f\\:facets__summary').outerHTML = source.querySelector('.f\\:facets__summary').outerHTML;
		}
	}

	static updateURLHash(searchParams) {
		history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
	}

	static getSections() {
		return [
			{
				section: document.querySelector('#product-grid').dataset.id,
			}
		]
	}

	createSearchParams(form) {
		const formData = new FormData(form);
		return new URLSearchParams(formData).toString();
	}

	onSubmitForm(searchParams, event) {
		FoxifyFacetFiltersForm.renderPage(searchParams, event);
	}

	onSubmitHandler(event) {
		const sortFilterForms = document.querySelectorAll('f-facet-filters-form form');
		if (event.srcElement.className === 'mobile-facets__checkbox') {
			const searchParams = this.createSearchParams(event.target.closest('form'))
			this.onSubmitForm(searchParams, event)
		} else {
			const forms = [];
			sortFilterForms.forEach((form) => {
				forms.push(this.createSearchParams(form));
			});
			this.onSubmitForm(forms.join('&'), event)
		}
	}

	onActiveFilterClick(event) {
		event.preventDefault();
		FoxifyFacetFiltersForm.toggleActiveFacets();
		const url = event.currentTarget.href.indexOf('?') === -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
		FoxifyFacetFiltersForm.renderPage(url);
	}
}

FoxifyFacetFiltersForm.filterData = [];
FoxifyFacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FoxifyFacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('f-facet-filters-form', FoxifyFacetFiltersForm);
FoxifyFacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
	constructor() {
		super();
		this.querySelectorAll('input')
			.forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));
		this.setMinAndMaxValues();
	}

	onRangeChange(event) {
		this.adjustToValidValues(event.currentTarget);
		this.setMinAndMaxValues();
	}

	setMinAndMaxValues() {
		const inputs = this.querySelectorAll('input');
		const minInput = inputs[0];
		const maxInput = inputs[1];
		if (maxInput.value) minInput.setAttribute('max', maxInput.value);
		if (minInput.value) maxInput.setAttribute('min', minInput.value);
		if (minInput.value === '') maxInput.setAttribute('min', 0);
		if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
	}

	adjustToValidValues(input) {
		const value = Number(input.value);
		const min = Number(input.getAttribute('min'));
		const max = Number(input.getAttribute('max'));

		if (value < min) input.value = min;
		if (value > max) input.value = max;
	}
}

customElements.define('f-price-range', PriceRange);

class FacetRemove extends HTMLElement {
	constructor() {
		super();
		const facetLink = this.querySelector('a');
		facetLink.setAttribute('role', 'button');
		facetLink.addEventListener('click', this.closeFilter.bind(this));
		facetLink.addEventListener('keyup', (event) => {
			event.preventDefault();
			if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
		});
	}

	closeFilter(event) {
		event.preventDefault();
		const form = this.closest('f-facet-filters-form') || document.querySelector('f-facet-filters-form');
		form.onActiveFilterClick(event);
	}
}

customElements.define('f-facet-remove', FacetRemove);

class FacetSubmit extends HTMLElement {
	constructor() {
		super()
		const drawer = this.closest('f-drawer-component')
		if (!drawer) return;
		this.querySelector('button').addEventListener('click', e => {
			e.preventDefault()
			drawer.closeDrawer(false)
		})
	}
}

customElements.define('f-facet-submit', FacetSubmit)

class ShowMoreButton extends HTMLElement {
	constructor() {
		super();
		const button = this.querySelector('button');
		button.addEventListener('click', (event) => {
			this.expandShowMore(event);
			const nextElementToFocus = event.target.closest('.f\\:facets__blocks').querySelector('.f\\:show-more-item')
			if (nextElementToFocus && !nextElementToFocus.classList.contains('f:hidden')) {
				nextElementToFocus.querySelector('input').focus()
			}
		});
	}
	expandShowMore(event) {
		const parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.f\\:facets__block');
		this.querySelectorAll('.label-text').forEach(element => element.classList.toggle('f:hidden'));
		parentDisplay.querySelectorAll('.f\\:show-more-item').forEach(item => item.classList.toggle('f:hidden'))
	}
}

customElements.define('f-show-more-button', ShowMoreButton);
