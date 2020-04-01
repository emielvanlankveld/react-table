/* eslint-disable react/no-did-update-set-state */
import React, { Component } from 'react'
import classnames from 'classnames'

const defaultButton = props => (
  <button type="button" {...props} className="-btn">
    {props.children}
  </button>
)

export default class ReactTablePagination extends Component {
  static defaultProps = {
    PreviousComponent: defaultButton,
    NextComponent: defaultButton,
    renderPageJump: ({
      onChange, value, onBlur, onKeyPress, inputType, pageJumpText,
    }) => (
        <div className="-pageJump">
          <input
            aria-label={pageJumpText}
            type={inputType}
            onChange={onChange}
            value={value}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
          />
        </div>
      ),
    renderCurrentPage: page => <span className="-currentPage">{page + 1}</span>,
    renderTotalPagesCount: pages => <span className="-totalPages">{pages || 1}</span>,
    renderPageSizeOptions: ({
      pageSize,
      pageSizeOptions,
      rowsSelectorText,
      onPageSizeChange,
      rowsText,
    }) => (
        <span className="select-wrap -pageSizeOptions">
          <select
            aria-label={rowsSelectorText}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <option key={i} value={option}>
                {`${option} ${rowsText}`}
              </option>
            ))}
          </select>
        </span>
      ),
  }

  constructor(props) {
    super(props)

    this.getSafePage = this.getSafePage.bind(this)
    this.changePage = this.changePage.bind(this)
    this.applyPage = this.applyPage.bind(this)

    this.state = {
      page: props.page
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.page !== this.props.page && prevState.page !== this.state.page) {
      // this is probably safe because we only update when old/new state.page are different
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        page: this.props.page,
      })
    }
    /* when the last page from new props is smaller
     than the current page in the page box,
     the current page needs to be the last page. */
    if (this.props.pages !== prevProps.pages && this.props.pages <= this.state.page) {
      this.setState({
        page: this.props.pages - 1,
      })
    }
  }

  getSafePage(page) {
    if (Number.isNaN(page)) {
      page = this.props.page
    }
    return Math.min(Math.max(page, 0), this.props.pages - 1)
  }

  filterPages = (visiblePages, totalPages) => {
    return visiblePages.filter(page => page <= totalPages);
  }

  getVisiblePages = (page, total) => {
    if (total < 6 || page < 3) {
      return this.filterPages([1, 2, 3, 4, 5], total)
    } else if (page + 2 > total) {
      return this.filterPages([total - 4, total - 3, total - 2, total - 1, total], total)
    } else {
      return this.filterPages([page - 2, page - 1, page, page + 1, page + 2], total)
    }
  }

  changePage(page) {
    page = this.getSafePage(page)
    this.setState({ page })
    if (this.props.page !== page) {
      this.setState({
        visiblePages: this.filterPages(this.getVisiblePages(page + 1, this.props.pages), this.props.pages)
      })

      this.props.onPageChange(page)
    }
  }

  updateCurrentRows(props) {
    if (typeof props.sortedData !== 'undefined'  //use props.data for unfiltered (all) rows
      && typeof props.page !== 'undefined'
      && typeof props.pageSize !== 'undefined'
    ) {
      this.rowCount = props.sortedData.length  //use props.data.length for unfiltered (all) rows
      this.rowMin = props.page * props.pageSize + 1
      this.rowMax = Math.min((props.page + 1) * props.pageSize, this.rowCount)
    }
  }

  applyPage(e) {
    if (e) {
      e.preventDefault()
    }
    const page = this.state.page
    this.changePage(page === '' ? this.props.page : page)
  }

  getPageJumpProperties() {
    return {
      onKeyPress: e => {
        if (e.which === 13 || e.keyCode === 13) {
          this.applyPage()
        }
      },
      onBlur: this.applyPage,
      value: this.state.page === '' ? '' : this.state.page + 1,
      onChange: e => {
        const val = e.target.value
        const page = val - 1
        if (val === '') {
          return this.setState({ page: val })
        }
        this.setState({ page: this.getSafePage(page) })
      },
      inputType: this.state.page === '' ? 'text' : 'number',
      pageJumpText: this.props.pageJumpText,
    }
  }

  render() {
    const {
      // Computed
      pages,
      // Props
      page,
      showPageSizeOptions,
      pageSizeOptions,
      pageSize,
      showPageJump,
      canPrevious,
      canNext,
      onPageSizeChange,
      className,
      PreviousComponent,
      NextComponent,
      renderPageJump,
      renderCurrentPage,
      renderTotalPagesCount,
      renderPageSizeOptions,
    } = this.props

    const pageNumber = this.props.page + 1
    const visiblePages = this.getVisiblePages(this.props.page, this.props.pages)
    this.updateCurrentRows(this.props)

    return (
      <div className={classnames(className, '-pagination')} style={this.props.style}>
        {this.rowCount && (
          <div className="-summary">
            Showing {this.rowMin} - {this.rowMax} of {this.rowCount} results
          </div>
        )}
        <div className="-previous">
          <PreviousComponent
            onClick={() => {
              if (!canPrevious) return
              this.changePage(page - 1)
            }}
            disabled={!canPrevious || this.state.page < 1}
          >
            {this.props.previousText}
          </PreviousComponent>
        </div>
        <div className="-center">
          {visiblePages.map((page, index, array) => {
            return (
              <a
                onClick={() => this.changePage(page - 1)}
                key={page}
                className={pageNumber === page ? "active" : ""}
              >
                {array[index - 1] + 2 < page ? `... ${page}` : page}
              </a>
            )
          })}
        </div>
        <div className="-next">
          <NextComponent
            onClick={() => {
              if (!canNext) return
              this.changePage(page + 1)
            }}
            disabled={!canNext || this.state.page >= this.props.pages}
          >
            {this.props.nextText}
          </NextComponent>
        </div>
      </div>
    )
  }
}
