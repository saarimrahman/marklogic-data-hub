import React from 'react';
import axiosMock from 'axios';
import { fireEvent, render, wait, waitForElement, cleanup } from "@testing-library/react";
import AdvancedSettingsDialog from './advanced-settings-dialog';
import mocks from '../../config/mocks.config';
import data from '../../config/advanced-settings.config';

jest.mock('axios');

describe('Advanced Settings dialog', () => {

  beforeEach(() => {
    mocks.advancedAPI(axiosMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  test('Verify settings for Load', async () => {
    const { getByText, getAllByText, queryByText } = render(
      <AdvancedSettingsDialog {...data.advancedLoad} />
    );

    expect(getByText('Advanced Settings')).toBeInTheDocument();

    //Verify if the step name is available in the settings dialog
    expect(document.querySelector('div p:nth-child(2)').textContent).toEqual(data.advancedLoad.stepData.name);

    expect(queryByText('Source Database')).not.toBeInTheDocument();
    expect(getByText('Target Database')).toBeInTheDocument();
    expect(getByText('data-hub-STAGING')).toBeInTheDocument();

    expect(getByText('Target Collections')).toBeInTheDocument();
    expect(getByText('Please select target collections')).toBeInTheDocument();
    expect(getByText('Default Collections')).toBeInTheDocument();
    expect((await(waitForElement(() => getAllByText('testCollection')))).length > 0);

    expect(getByText('Target Permissions')).toBeInTheDocument();

    expect(getByText('Header Content')).toBeInTheDocument();
    expect(getByText('{ "header": true }')).toBeInTheDocument();

    expect(getByText('Provenance Granularity')).toBeInTheDocument();
    expect(getByText('Coarse-grained')).toBeInTheDocument();

    expect(getByText('Processors')).toBeInTheDocument();
    expect(getByText('Custom Hook')).toBeInTheDocument();

    fireEvent.click(getByText('Processors'));
    expect(getByText('{ "processor": true }')).toBeInTheDocument();

    fireEvent.click(getByText('Custom Hook'));
    expect(getByText('{ "hook": true }')).toBeInTheDocument();

  });

  test('Verify settings for Mapping', async () => {
    const { getByText, getAllByText } = render(
      <AdvancedSettingsDialog {...data.advancedMapping} />
    );

    expect(getByText('Advanced Settings')).toBeInTheDocument();

    //Verify if the step name is available in the settings dialog
    expect(document.querySelector('div p:nth-child(2)').textContent).toEqual(data.advancedMapping.stepData.name);

    expect(getByText('Source Database')).toBeInTheDocument();
    expect(getByText('data-hub-STAGING')).toBeInTheDocument();
    expect(getByText('Target Database')).toBeInTheDocument();
    expect(getByText('data-hub-FINAL')).toBeInTheDocument();

    expect(getByText('Target Collections')).toBeInTheDocument();
    expect(getByText('Please select target collections')).toBeInTheDocument();
    expect(getByText('Default Collections')).toBeInTheDocument();
    expect((await(waitForElement(() => getAllByText('testCollection')))).length > 0);

    expect(getByText('Target Permissions')).toBeInTheDocument();

    expect(getByText('Header Content')).toBeInTheDocument();
    expect(getByText('{ "header": true }')).toBeInTheDocument();

    expect(getByText('Provenance Granularity')).toBeInTheDocument();
    expect(getByText('Coarse-grained')).toBeInTheDocument();

    expect(getByText('Processors')).toBeInTheDocument();
    expect(getByText('Custom Hook')).toBeInTheDocument();

    fireEvent.click(getByText('Processors'));
    expect(getByText('{ "processor": true }')).toBeInTheDocument();

    fireEvent.click(getByText('Custom Hook'));
    expect(getByText('{ "hook": true }')).toBeInTheDocument();

  });

  test('Verify form fields can be input/selected', () => {
    const { getByText, getAllByText, getByLabelText, getAllByTestId, getByPlaceholderText } = render(
      <AdvancedSettingsDialog {...data.advancedMapping} />
    );

    fireEvent.click(getByLabelText('sourceDatabase-select'));
    const sourceDbOptions = getAllByTestId('sourceDbOptions').map(li => li);
    expect(sourceDbOptions.map(li => li.textContent).toString()).toEqual('data-hub-STAGING,data-hub-FINAL');
    fireEvent.select(sourceDbOptions[1]);
    expect(getAllByText('data-hub-FINAL').length === 2);

    fireEvent.click(getByLabelText('targetDatabase-select'));
    const targetDbOptions = getAllByTestId('sourceDbOptions').map(li => li);
    expect(targetDbOptions.map(li => li.textContent).toString()).toEqual('data-hub-STAGING,data-hub-FINAL');
    fireEvent.select(targetDbOptions[0]);
    expect(getAllByText('data-hub-STAGING').length === 1);

    //Not able to send input to Additional collections. Test via e2e
    //https://github.com/testing-library/react-testing-library/issues/375
    //Solution in github wont work because our list for additional collection is empty to start with

    fireEvent.change(getByPlaceholderText('Please enter target permissions'), { target: { value: 'permissions-changed' }});
    expect(getByPlaceholderText('Please enter target permissions')).toHaveValue('permissions-changed');

    fireEvent.change(getByLabelText('headers-textarea'), { target: { value: 'headers-changed' }});
    expect(getByLabelText('headers-textarea')).toHaveValue('headers-changed');

    fireEvent.click(getByText('Please select target format'));
    const formatOptions = getAllByTestId('targetFormatOptions').map(li => li);
    expect(formatOptions.map(li => li.textContent).toString()).toEqual('JSON,XML');
    fireEvent.select(formatOptions[1]);
    expect(getByText('XML')).toBeInTheDocument();

    fireEvent.click(getByText('Coarse-grained'));
    const provOptions = getAllByTestId('provOptions').map(li => li);
    expect(provOptions.map(li => li.textContent).toString()).toEqual('Coarse-grained,Off');
    fireEvent.select(provOptions[1]);
    expect(getByText('Off')).toBeInTheDocument();

    fireEvent.click(getByText('Processors'));
    fireEvent.change(getByLabelText('processors-textarea'), { target: { value: 'processors-changed' }});
    expect(getByLabelText('processors-textarea')).toHaveValue('processors-changed');

    fireEvent.click(getByText('Custom Hook'));
    fireEvent.change(getByLabelText('customHook-textarea'), { target: { value: 'hook-changed' }});
    expect(getByLabelText('customHook-textarea')).toHaveValue('hook-changed');

  });

  test('Verify read only users cannot edit settings', () => {
    const { getByText, getByPlaceholderText } = render(
      <AdvancedSettingsDialog {...data.advancedMapping} canWrite={false} />
    );
    expect(document.querySelector('#sourceDatabase')).toHaveClass('ant-select-disabled');
    expect(document.querySelector('#targetDatabase')).toHaveClass('ant-select-disabled');
    expect(document.querySelector('#additionalColl')).toHaveClass('ant-select-disabled');
    expect(getByPlaceholderText('Please enter target permissions')).toBeDisabled();
    expect(document.querySelector('#headers')).toHaveClass('ant-input-disabled');
    expect(document.querySelector('#targetFormat')).toHaveClass('ant-select-disabled');
    expect(document.querySelector('#provGranularity')).toHaveClass('ant-select-disabled');

    fireEvent.click(getByText('Processors'));
    expect(document.querySelector('#processors')).toHaveClass('ant-input-disabled');

    fireEvent.click(getByText('Custom Hook'));
    expect(document.querySelector('#customHook')).toHaveClass('ant-input-disabled');
  });

  test('Verify post is called when Mapping settings are saved', async () => {
    //Enhance this test once DHFPROD-4712 is fixed
    const { getByText } = render(<AdvancedSettingsDialog {...data.advancedMapping} />);
    expect(getByText('Save')).toBeInTheDocument();
    await wait(() => {
      fireEvent.click(getByText('Save'));
    });
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  test('Verify post is called when Load settings are saved', async () => {
    const { getByText } = render(<AdvancedSettingsDialog {...data.advancedLoad} />);
    expect(getByText('Save')).toBeInTheDocument();
    await wait(() => {
      fireEvent.click(getByText('Save'));
    });
    expect(axiosMock.post).toHaveBeenCalledTimes(1);
  });

  test('Verify discard dialog is not opened when Mapping settings are canceled with no changes', () => {
    const { getByText, queryByText } = render(<AdvancedSettingsDialog {...data.advancedMapping} />);
    expect(getByText('Advanced Settings')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  test('Verify discard dialog is not opened when Load settings are canceled with no changes', () => {
    const { getByText, queryByText } = render(<AdvancedSettingsDialog {...data.advancedLoad} />);
    expect(getByText('Advanced Settings')).toBeInTheDocument();
    fireEvent.click(getByText('Cancel'));
    expect(queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  test('Verify discard dialog modal when Cancel is clicked', () => {
    const { getByPlaceholderText, getByText } = render(
      <AdvancedSettingsDialog {...data.advancedMapping} />
    );

    fireEvent.change(getByPlaceholderText('Please enter target permissions'), { target: { value: 'permissions-changed' }});
    fireEvent.click(getByText('Cancel'));
    expect(getByText('Discard changes?')).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('No')).toBeInTheDocument();

    const noButton = getByText('No');
    noButton.onclick = jest.fn();
    fireEvent.click(noButton);
    expect(noButton.onclick).toHaveBeenCalledTimes(1);

    const yesButton = getByText('Yes');
    yesButton.onclick = jest.fn();
    fireEvent.click(yesButton);
    expect(yesButton.onclick).toHaveBeenCalledTimes(1);
  });

  test('Verify discard dialog modal when "x" is clicked', () => {
    const { getByPlaceholderText, getByText, getByLabelText } = render(
      <AdvancedSettingsDialog {...data.advancedMapping} />
    );

    fireEvent.change(getByPlaceholderText('Please enter target permissions'), { target: { value: 'permissions-changed' }});
    expect(getByPlaceholderText('Please enter target permissions')).toHaveValue('permissions-changed');
    fireEvent.click(getByLabelText('Close'));
    expect(getByText('Discard changes?')).toBeInTheDocument();
    expect(getByText('Yes')).toBeInTheDocument();
    expect(getByText('No')).toBeInTheDocument();
  });

});
