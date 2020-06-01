import React from 'react';
import { render, fireEvent, wait, within, cleanup } from '@testing-library/react';
import LoadList from './load-list';
import data from '../../config/test-data.config';
import axiosMock from 'axios';
import mocks from '../../config/mocks.config';

jest.mock('axios');

describe('Load data component', () => {

  beforeEach(() => {
      mocks.loadAPI(axiosMock);
  })

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  })

  test('Verify Load list view renders correctly with no data', () => {
    const { getByText } = render(<LoadList {...data.loadData} data={[]} />)
    const tableColumns = within(getByText('Name').closest('tr'));

    expect(getByText('Add New')).toBeInTheDocument();
    expect(tableColumns.getByText('Name')).toBeInTheDocument();
    expect(tableColumns.getByText('Description')).toBeInTheDocument();
    expect(tableColumns.getByText('Source Format')).toBeInTheDocument();
    expect(tableColumns.getByText('Target Format')).toBeInTheDocument();
    expect(tableColumns.getByText('Last Updated')).toBeInTheDocument();
    expect(tableColumns.getByText('Action')).toBeInTheDocument();
    expect(getByText('No Data')).toBeInTheDocument();
  })

  test('Verify Load list view renders correctly with data', () => {
    const { getByText, getAllByLabelText } = render(<LoadList {...data.loadData} />)
    const dataRow = within(getByText('testLoadXML').closest('tr'));

    expect(dataRow.getByText(data.loadData.data[1].name)).toBeInTheDocument();
    expect(dataRow.getByText(data.loadData.data[1].description)).toBeInTheDocument();
    expect(dataRow.getByText(data.loadData.data[1].sourceFormat)).toBeInTheDocument();
    expect(dataRow.getByText(data.loadData.data[1].targetFormat)).toBeInTheDocument();
    expect(dataRow.getByText('04/15/2020 2:22PM')).toBeInTheDocument();
    expect(dataRow.getByTestId(`${data.loadData.data[1].name}-settings`)).toBeInTheDocument();
    expect(dataRow.getByTestId(`${data.loadData.data[1].name}-delete`)).toBeInTheDocument();

    expect(getAllByLabelText('icon: setting').length).toBe(2);
  })

  test('Verify Load settings from list view renders correctly', async () => {
    const {getByText, getByTestId, getByTitle,queryByTitle, getByPlaceholderText } = render(<LoadList {...data.loadData} />)

    // NOTE see config/advanced-settings.config.ts for test data
    await wait(() => {
      fireEvent.click(getByTestId(data.loadData.data[0].name+'-settings'));
    })

    let targetCollection = getByTitle('addedCollection'); // Additional target collection (Added by user)

    expect(getByText('Advanced Settings')).toBeInTheDocument();
    // Check if the settings API is being called.
    expect(axiosMock.get).toBeCalledWith('/api/steps/ingestion/' + data.loadData.data[0].name);
    expect(getByText('Target Collections')).toBeInTheDocument();
    expect(targetCollection).toBeInTheDocument(); //Should be available in the document
    expect(targetCollection).not.toBe('testCollection'); //Should not be same as the default collection
    expect(getByText('Default Collections')).toBeInTheDocument();
    expect(getByTestId(`defaultCollections-testCollection`)).toBeInTheDocument();
    expect(queryByTitle('testCollection')).not.toBeInTheDocument();  // The default collection should not be a part of the Target Collection list
    expect(getByText('Batch Size')).toBeInTheDocument();
    expect(getByPlaceholderText('Please enter batch size')).toHaveValue('35');
  })
});
