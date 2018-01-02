var h = hyperapp.h;
var app = hyperapp.app;

var renderColumn = function(data, columnType) {
  if (columnType === 'currency') {
    if (data === undefined || data === null || isNaN(parseFloat(data))) {
      return '';
    }

    return parseFloat(data).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
  } else if (columnType === 'percentage') {
    if (data === undefined || data === null || isNaN(parseFloat(data))) {
      return '';
    }

    return parseFloat(data).toLocaleString('en', {style: 'percent'});
  }

  return data;
};

var HyperTable = function(columns, rows) {
  var self = this;

  self.state = {
    columns: columns,
    rows: rows,
    pageNumber: 1,
    perPage: 10,
    sortKey: '',
    sortDir: 'asc',
    filter: ''
  };

  self.actions = {
    setPageNumber: function(value) {
      return function(state) {
        return { pageNumber: value };
      };
    },
    handleSortChange: function(newSortKey) {
      return function(state) {
        var newState = {};

        if (state.sortKey === newSortKey) {
          newState.sortDir = state.sortDir === 'asc' ? 'dsc' : 'asc';
        } else {
          newState.sortDir = 'asc';
          newState.sortKey = newSortKey;
        }

        return newState;
      };
    },
    setPerPage: function(value) {
      return function(state) {
        var newState = {
          perPage: value
        };

        if (value === -1) {
          var newNumPages = 1;
        } else {
          var newNumPages = Math.round(state.rows.length / value);
        }

        if (state.pageNumber > newNumPages) {
          newState.pageNumber = newNumPages;
        }

        return newState;
      }
    },
    setFilter: function(value) {
      return function(state) {
        return { filter: value };
      }
    }
  };

  self.view = function(state, actions) {
    if (state.perPage !== -1) {
      var numPages = Math.round(state.rows.length / state.perPage);

      var startIndex = (state.pageNumber - 1) * state.perPage;
      var endIndex = startIndex + state.perPage;
    } else {
      var numPages = 1;

      var startIndex = 0;
      var endIndex = state.rows.length;
    }

    var sortedRows = [].concat(state.rows);

    if (state.sortKey) {
      sortedRows.sort(function(a, b) {
        if (a[state.sortKey] < b[state.sortKey]) {
          return state.sortDir === 'asc' ? -1 : 1;
        } else if (a[state.sortKey] > b[state.sortKey]) {
          return state.sortDir === 'asc' ? 1 : -1;
        }

        return 0;
      });
    }

    var slicedRows = sortedRows.slice(startIndex, endIndex);

    var filteredRows = slicedRows;

    if (state.filter) {
      filteredRows = slicedRows.filter(function(row) {
        return state.columns.some(function(column) {
          if (column.filterable === false) {
            return false;
          }

          return (row[column.key] || '').toString().toLowerCase().trim().indexOf(state.filter.toLowerCase().trim()) !== -1;
        });
      });
    }

    var header = h('div', { className: 'row' }, [
      h('div', { className: 'col-sm-6'}, [
        h('span', {}, 'Per page: '),
        h('select', { value: state.perPage, onchange: function() { actions.setPerPage(parseInt(this.value)); } }, [
          h('option', { value: '5' }, '5'),
          h('option', { value: '10' }, '10'),
          h('option', { value: '20' }, '20'),
          h('option', { value: '-1' }, 'All')
        ])
      ]),
      h('div', { className: 'col-sm-6' }, [
        h('span', {}, 'Search: '),
        h('input', { value: state.filter, onkeyup: function() { actions.setFilter(this.value); }, type: 'text' }, '')
      ])
    ]);

    var thead = h('thead', {}, [
      h('tr', {}, state.columns.map(function(column) {
        return h('th', { onclick: function() { actions.handleSortChange(column.key); } }, `${column.title} ${state.sortKey === column.key ? (state.sortDir === 'asc' ? " \u2191" : " \u2193") : ''}`);
      }))
    ]);

    var tbody = h('tbody', {}, [
      filteredRows.map(function(row) {
        return h('tr', {}, state.columns.map(function(column) {
          return h('td', {}, renderColumn(row[column.key], column.type));
        }));
      })
    ]);

    var table = h('table', { className: 'table table-bordered' }, [
      thead,
      tbody
    ]);

    var footer = h('div', { className: 'row' }, [
      h('div', { className: 'col-sm-6'}, [
        h('span', {}, `Showing ${startIndex + 1} to ${filteredRows.length} of ${filteredRows.length} ${state.filter ? `(filtered from ${state.rows.length})` : ''}`)
      ]),
      h('div', { className: 'col-sm-6'}, [
        h('button', { className: 'btn btn-sm btn-default', onclick: function() { actions.setPageNumber(1); }, disabled: state.pageNumber === 1 }, '<<'),
        h('button', { className: 'btn btn-sm btn-default', onclick: function() { actions.setPageNumber(state.pageNumber - 1); }, disabled: state.pageNumber === 1 }, '<'),
        h('button', { className: 'btn btn-sm btn-default', disabled: true }, `${state.pageNumber}`),
        h('button', { className: 'btn btn-sm btn-default', onclick: function() { actions.setPageNumber(state.pageNumber + 1); }, disabled: state.pageNumber === numPages }, '>'),
        h('button', { className: 'btn btn-sm btn-default', onclick: function() { actions.setPageNumber(numPages); }, disabled: state.pageNumber === numPages }, '>>')
      ])
    ]);

    return h('div', {}, [
      h('div', { className: 'margin-bottom' }, [
        header
      ]),
      h('div', { className: 'margin-bottom' }, [
        table
      ]),
      h('div', { className: 'margin-bottom' }, [
        footer
      ])
    ]);
  };
};
