import React, { useCallback, useEffect, useState, useRef } from 'react';
import styled from '@emotion/styled';
import _debounce from 'lodash/debounce';
import { loadStateFromLocalStorage, saveStateToLocalStorage } from '../../utils/localStorage';

// HOPR
import Tooltip from '../../future-hopr-lib-components/Tooltip/tooltip-fixed-width';

// Mui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import TextField from '@mui/material/TextField';

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

const STable = styled(Table)`
  tr.onRowClick {
    cursor: pointer;
  }
`;

const STableCell = styled(TableCell)`
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 8px 16px;
  max-width: calc(100% - 168px);
  &.actions {
    overflow: unset;
  }
  &.wrap {
    overflow-wrap: anywhere;
    text-overflow: unset;
    white-space: unset;
  }
`;

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        ml: 2.5,
      }}
    >
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

const OverTable = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  &.searchIncluded {
    justify-content: space-between;
  }
`;

const STextField = styled(TextField)`
  flex-grow: 1;
  margin: 0px 16px;
`;

interface Props {
  data: {
    [key: string]: string | number | JSX.Element;
    id: string | number;
    actions: JSX.Element;
  }[];
  id?: string;
  header: {
    key: string;
    name: string;
    search?: boolean;
    tooltip?: boolean;
    width?: string;
    wrap?: boolean;
    maxWidth?: string;
    copy?: boolean;
    hidden?: boolean;
    tooltipHeader?: string | JSX.Element;
  }[];
  search?: boolean;
  loading?: boolean;
  onRowClick?: Function;
  orderByDefault?: string;
}

type Order = 'asc' | 'desc';

const isString = (value: any) => typeof value === 'string' || value instanceof String;

function descendingComparator<T>(
  a: { [key in string]: number | string },
  b: { [key in string]: number | string },
  orderBy: string,
) {
  if (isString(b[orderBy]) && isString(a[orderBy])) {
    if ((b[orderBy] as string).toLowerCase() < (a[orderBy] as string).toLowerCase()) {
      return -1;
    }
    if ((b[orderBy] as string).toLowerCase() > (a[orderBy] as string).toLowerCase()) {
      return 1;
    }
  }

  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: string,
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function CustomPaginationActionsTable(props: Props) {
  const rowsPerPageFromLocalStorage = loadStateFromLocalStorage(`pro-table_rows-per-page_${props.id}`) as number | null;
  const [page, set_Page] = React.useState(0);
  const [rowsPerPage, set_RowsPerPage] = React.useState(
    props.id && rowsPerPageFromLocalStorage ? rowsPerPageFromLocalStorage : 10,
  );
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<string>(props.orderByDefault || props.header[0].key || 'id');
  const [searchPhrase, set_searchPhrase] = React.useState('');
  const [filteredData, set_filteredData] = React.useState<typeof props.data>([]);

  const ref = useRef(null);

  useEffect(() => {
    filterData(searchPhrase);
  }, [props.data]);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredData.length) : 0;

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    set_Page(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    set_RowsPerPage(newRowsPerPage);
    if (props.id) saveStateToLocalStorage(`pro-table_rows-per-page_${props.id}`, newRowsPerPage);
    set_Page(0);
  };

  const debounceFn = useCallback(_debounce(filterData, 150), [props.data]);

  function handleSearchChange(event: { target: { value: string } }) {
    const search: string = event.target.value;
    if (search !== searchPhrase) {
      set_Page(0);
    }
    set_searchPhrase(search);
    debounceFn(search);
  }

  function filterData(searchPhrase: string) {
    const data = props.data;
    const filterBy = props.header.filter((elem) => elem.search === true).map((header) => header.key);

    // SearchPhrase filter
    if (!searchPhrase || searchPhrase === '') {
      set_filteredData(data);
      return;
    }
    const filtered = data.filter((elem) => {
      for (let i = 0; i < filterBy.length; i++) {
        if (
          typeof elem[filterBy[i]] === 'string' &&
          (elem[filterBy[i]] as string).toLowerCase().includes(searchPhrase.toLowerCase())
        )
          return true;
      }
    });
    set_filteredData(filtered);
    return;
  }

  const visibleRows = React.useMemo(
    () =>
      [...filteredData]
        //@ts-ignore as we can input JSX into the data, but we will not sort by it
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, rowsPerPage !== -1 ? page * rowsPerPage + rowsPerPage : filteredData.length),
    [rowsPerPage, filteredData, order, orderBy, page, rowsPerPage],
  );

  return (
    <TableContainer
      component={Paper}
      ref={ref}
    >
      <OverTable className={`OverTable ${props.search ? 'searchIncluded' : ''}`}>
        {props.search && (
          <STextField
            label="Search"
            variant="standard"
            value={searchPhrase}
            onChange={handleSearchChange}
          />
        )}
        <TablePagination
          rowsPerPageOptions={[
            10,
            50,
            {
              label: 'All',
              value: -1,
            },
          ]}
          colSpan={props.header.length - 1}
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' },
            native: true,
          }}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          ActionsComponent={TablePaginationActions}
          component={'div'}
        />
      </OverTable>
      <STable aria-label="custom pagination table">
        <thead>
          <TableRow>
            {props.header.map(
              (headElem, idx) =>
                !headElem.hidden && (
                  <STableCell
                    key={idx}
                    className={`TableCell TableCellHeader`}
                    width={headElem?.width ?? ''}
                  >
                    <Tooltip
                      title={headElem.tooltipHeader}
                      notWide
                    >
                      <span>{headElem.name}</span>
                    </Tooltip>
                  </STableCell>
                ),
            )}
          </TableRow>
        </thead>
        <TableBody>
          {visibleRows.map((row) => (
            <CustomTableRow
              row={row}
              header={props.header}
              id={`${props.id}_row_${row.id}`}
              key={`${props.id}_row_${row.id}`}
              onRowClick={props.onRowClick}
            />
          ))}
          {!props.data ||
            (props.data.length === 0 && (
              <>
                <TableRow style={{ height: 57 }}>
                  <STableCell colSpan={props.header.length}>{props.loading ? 'Loading...' : 'No entries'}</STableCell>
                </TableRow>
                <TableRow style={{ height: 57 * (rowsPerPage - 1) }}>
                  <STableCell colSpan={props.header.length} />
                </TableRow>
              </>
            ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 57 * emptyRows }}>
              <STableCell colSpan={props.header.length} />
            </TableRow>
          )}
        </TableBody>
      </STable>
    </TableContainer>
  );
}

const CustomTableRow = ({
  id,
  row,
  header,
  onRowClick,
}: {
  id: string;
  row: Props['data'][0];
  header: Props['header'];
  onRowClick?: Function;
}) => {
  const [tooltip, set_tooltip] = useState<string>();

  const onDoubleClick = (event: React.MouseEvent<HTMLTableCellElement, MouseEvent>, value: string) => {
    // if row is clicked twice
    if (event.detail === 2) {
      navigator.clipboard.writeText(value);
      set_tooltip('Copied');
      setTimeout(() => {
        set_tooltip(undefined);
      }, 3000);
    }
  };

  return (
    <TableRow
      key={row.id}
      id={id}
      onClick={() => {
        onRowClick && onRowClick(row);
      }}
      className={`${onRowClick ? 'onRowClick' : ''}`}
    >
      {header.map(
        (headElem) =>
          !headElem.hidden && (
            <STableCell
              key={headElem.key}
              className={`TableCell ${headElem.key} ${headElem.wrap ? 'wrap' : ''}`}
              width={headElem.width}
              style={{ maxWidth: headElem.maxWidth }}
              onClick={(event) =>
                headElem.copy && typeof row[headElem.key] === 'string'
                  ? onDoubleClick(event, row[headElem.key] as string)
                  : undefined
              }
            >
              {headElem.tooltip ? (
                <Tooltip title={tooltip ?? row[headElem.key]}>
                  <span>{row[headElem.key]}</span>
                </Tooltip>
              ) : (
                row[headElem.key]
              )}
            </STableCell>
          ),
      )}
    </TableRow>
  );
};
