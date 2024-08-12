if (!customElements.get('f-sticky-atc-bar')) {
	customElements.define('f-sticky-atc-bar', class StickyAtcBar extends HTMLElement {
		constructor() {
			super()
			document.body.classList.add('sticky-atc-bar-enabled')
		}

		connectedCallback() {
			this.productFormActions = document.querySelector('.f\\:main-product-form')
			this.container = this.closest('.f\\:sticky-atc')

			const stickyAtcBlock = this.closest('.f\\:product-single__block')
			const foxifyWrapper = document.querySelector('.f-app')
			if (stickyAtcBlock && foxifyWrapper && ![...foxifyWrapper.children].includes(stickyAtcBlock)) {
				foxifyWrapper.appendChild(stickyAtcBlock)
				this.init()
			}
		}

		init() {
			this.productId = this.dataset.productId
			const isMobile = window.matchMedia('(max-width: 639px)')
			isMobile.addEventListener('change', this.checkDevice.bind(this))
			// Initial check
			this.checkDevice(isMobile)

			// const headerHeight = window.FoxThemeSettings.headerHeight || 80
			const rootMargin = `0px 0px 0px 0px`
			this.observer = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					const method = entry.intersectionRatio !== 1 ? 'add' : 'remove'
					this.container.classList[method]('f:sticky-atc--show')
				})
			}, {threshold: 1, rootMargin})
			this.setObserveTarget()
			this.syncWithMainProductForm()
		}

		setObserveTarget = () => {
			this.observer.observe(this.productFormActions)
			this.observeTarget = this.productFormActions
		}

		checkDevice(e) {
			const sectionHeight = this.clientHeight + 'px'
			document.documentElement.style.setProperty("--f-sticky-atc-bar-height", sectionHeight)
		}

		syncWithMainProductForm() {
			const variantInput = this.querySelector('[name="id"]')
			window.Foxify.Events.subscribe(`${this.productId}__VARIANT_CHANGE`, async (variant) => {
				variantInput.value = variant.id
			})
		}
	})
}
