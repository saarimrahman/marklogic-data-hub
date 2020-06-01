import {
  Modal,
  Form,
  Input,
  Button,
  Tooltip,
  Icon,
  Select,
} from 'antd';
import React, { useState, useEffect, useContext } from 'react';
import styles from './advanced-settings-dialog.module.scss';
import { AdvancedSettings } from '../../config/tooltips.config';
import { UserContext } from '../../util/user-context';
import Axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const AdvancedSettingsDialog = (props) => {
  const { resetSessionTime } = useContext(UserContext);
  const tooltips = Object.assign({}, AdvancedSettings, props.tooltipsData);
  const stepType = props.activityType;

  const usesSourceDatabase = stepType !== 'ingestion';
  const defaultSourceDatabase = usesSourceDatabase ? 'data-hub-STAGING' : 'data-hub-FINAL';
  const [sourceDatabase, setSourceDatabase] = useState(defaultSourceDatabase);
  const [sourceDatabaseTouched, setSourceDatabaseTouched] = useState(false);

  const defaultTargetDatabase = !usesSourceDatabase ? 'data-hub-STAGING' : 'data-hub-FINAL';
  const databaseOptions = ['data-hub-STAGING','data-hub-FINAL'];
  const [targetDatabase, setTargetDatabase] = useState(defaultTargetDatabase);
  const [targetDatabaseTouched, setTargetDatabaseTouched] = useState(false);

  const [defaultCollections, setDefaultCollections] = useState<any[]>([]);
  const [additionalCollections, setAdditionalCollections ] = useState<any[]>([]);
  const [addCollTouched, setAddCollTouched] = useState(false);

  const [targetPermissions, setTargetPermissions] = useState('');
  const [targetPermissionsTouched, setTargetPermissionsTouched] = useState(false);

  const usesHeaders = stepType === 'ingestion' || stepType === 'mapping';
  const [headers, setHeaders] = useState('');
  const [headersTouched, setHeadersTouched] = useState(false);

  const usesTargetFormat = stepType === 'mapping';
  const targetFormatOptions = ['JSON', 'XML'].map(d => <Option data-testid='targetFormatOptions' key={d}>{d}</Option>);
  const [targetFormat, setTargetFormat] = useState('JSON');
  const [targetFormatTouched, setTargetFormatTouched] = useState(false);

  const provGranularityOptions = { 'Coarse-grained': 'coarse', 'Off': 'off' };
  const [provGranularity, setProvGranularity] = useState('coarse');
  const [provGranTouched, setProvGranTouched] = useState(false);

  const [processors, setProcessors] = useState('');
  const [processorsTouched, setProcessorsTouched] = useState(false);
  const [processorsExpanded, setProcessorsExpanded] = useState(false);

  const [customHook, setCustomHook] = useState('');
  const [customHookTouched, setCustomHookTouched] = useState(false);  
  const [customHookExpanded, setCustomHookExpanded] = useState(false);
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loading,setLoading] = useState(false);

  const canReadWrite = props.canWrite;

  useEffect(() => {
    getSettingsArtifact();

    return () => {
      setSourceDatabaseTouched(false);
      setTargetDatabaseTouched(false);
      setAddCollTouched(false);
      setTargetPermissionsTouched(false);
      setHeadersTouched(false);
      setTargetFormatTouched(false);
      setProvGranTouched(false);
      setProcessorsTouched(false);
      setCustomHookTouched(false);

      setSourceDatabase(defaultSourceDatabase);
      setTargetDatabase(defaultTargetDatabase);
      setAdditionalCollections([]);
      setTargetPermissions('');
      setHeaders('');
      setTargetFormat('');
      setProvGranularity('coarse');
      setProcessors('');
      setCustomHook('');
    };
  },[props.openAdvancedSettings  ,loading])

  // Convert JSON from JavaScript object to formatted string
  const formatJSON = (json) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (error) {
      console.error(error);
      return json
    }
  }

  // Convert JSON from string to JavaScript object
  const parseJSON = (json) => {
    try {
      return JSON.parse(json);
    } catch (error) {
      console.error(error);
      return json
    }
  }

  // CREATE/POST settings Artifact
  const createSettingsArtifact = async (settingsObj) => {
    console.log('settingsObj', settingsObj);
    if (props.stepData.name) {
      try {
        setLoading(true);
        let response = await Axios.post(`/api/steps/${stepType}/${props.stepData.name}`, settingsObj);
        if (response.status === 200) {
          setLoading(false);
        }
      } catch (error) {
        let message = error.response.data.message;
        console.error('Error while creating the activity settings artifact', message)
        setLoading(false);
      } finally {
        resetSessionTime();
      }
    }
  }

  // GET the settings artifact
  const getSettingsArtifact = async () => {
    if (props.stepData.name) {
      try {
        let response = await Axios.get(`/api/steps/${stepType}/${props.stepData.name}`);

        if (response.status === 200) {
          if (response.data.sourceDatabase) {
            setSourceDatabase(response.data.sourceDatabase);
          }
          if (response.data.collections) {
            setDefaultCollections(response.data.collections);
          }
          setTargetDatabase(response.data.targetDatabase);
          setAdditionalCollections([...response.data.additionalCollections]);
          setTargetPermissions(response.data.permissions);
          setHeaders(formatJSON(response.data.headers));
          setTargetFormat(response.data.targetFormat);
          setProvGranularity(response.data.provenanceGranularityLevel);
          setProcessors(formatJSON(response.data.processors));
          setCustomHook(formatJSON(response.data.customHook));
        }
      } catch (error) {
        let message = error.response;
        console.error('Error while fetching load settings artifacts', message || error);
        setSourceDatabase(defaultSourceDatabase);
        setTargetDatabase(defaultTargetDatabase);
        setAdditionalCollections([]);
        setTargetPermissions('');
        setHeaders('');
        setTargetFormat('JSON');
        setProvGranularity('coarse');
        setProcessors('');
        setCustomHook('');
      } finally {
        resetSessionTime();
      }
    }
  }

  const onCancel = () => {
    if(checkDeleteOpenEligibility()){
      setDeleteDialogVisible(true);
    } else {
      props.setOpenAdvancedSettings(false)
    }
  }

  const onOk = () => {
    props.setOpenAdvancedSettings(false)
  }

  //Check if Delete Confirmation dialog should be opened or not.
  const checkDeleteOpenEligibility = () => {

      if ( !sourceDatabaseTouched
        && !targetDatabaseTouched
        && !addCollTouched
        && !targetPermissionsTouched
        && !headersTouched
        && !targetFormatTouched
        && !provGranTouched
        && !processorsTouched
        && !customHookTouched
      ) {
        return false;
      } else {
        return true;
      }
  }

  const onDelOk = () => {
    props.setOpenAdvancedSettings(false)
    setDeleteDialogVisible(false)
  }

  const onDelCancel = () => {
    setDeleteDialogVisible(false)
  }

  const deleteConfirmation = <Modal
      visible={deleteDialogVisible}
      bodyStyle={{textAlign: 'center'}}
      width={250}
      maskClosable={false}
      closable={false}
      footer={null}
  >
      <span className={styles.ConfirmationMessage}>Discard changes?</span><br/><br/>
      <div >
          <Button onClick={() => onDelCancel()}>No</Button>&nbsp;&nbsp;
          <Button type="primary" htmlType="submit" onClick={onDelOk}>Yes</Button>
        </div>
  </Modal>;

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    if (event) event.preventDefault();

    let dataPayload = {
        collections: defaultCollections,
        additionalCollections: additionalCollections,
        sourceDatabase: usesSourceDatabase ? sourceDatabase: null,
        targetDatabase: targetDatabase,
        targetFormat: targetFormat,
        permissions: targetPermissions,
        headers: parseJSON(headers),
        processors: parseJSON(processors),
        provenanceGranularityLevel: provGranularity,
        customHook: parseJSON(customHook),
      }

    createSettingsArtifact(dataPayload);
    props.setOpenAdvancedSettings(false)
  }

  const handleChange = (event) => {

    if (event.target.id === 'targetPermissions') {
      setTargetPermissions(event.target.value);
      setTargetPermissionsTouched(true);
    }

    if (event.target.id === 'headers') {
      setHeaders(event.target.value);
      setHeadersTouched(true);
    }

    if (event.target.id === 'processors') {
      setProcessors(event.target.value);
      setProcessorsTouched(true);
    }

    if (event.target.id === 'customHook') {
      setCustomHook(event.target.value);
      setCustomHookTouched(true);
    }

  }

  const handleTargetFormat = (value) => {
    if (value === ' ' || value === targetFormat) {
      setTargetFormatTouched(false);
    }
    else {
      setTargetFormat(value);
      setTargetFormatTouched(true);
    }
  }

  const handleTargetDatabase = (value) => {

    if (value === ' ') {
      setTargetDatabaseTouched(false);
    }
    else {
      setTargetDatabaseTouched(true);
      setTargetDatabase(value);
    }
  }


  const handleSourceDatabase = (value) => {

      if (value === ' ') {
          setSourceDatabaseTouched(false);
      }
      else {
          setSourceDatabaseTouched(true);
          setSourceDatabase(value);
      }
  }

  const handleAddColl = (value) => {

    if (value === ' ') {
      setAddCollTouched(false);
    }
    else {
      setAddCollTouched(true);
      // default collections will come from default settings retrieved. Don't want them to be added to additionalCollections property
      setAdditionalCollections(value.filter((col) => !defaultCollections.includes(col)));
    }
  }

  const handleProvGranularity = (value) => {

    if (value === ' ') {
      setProvGranTouched(false);
    }
    else {
      setProvGranTouched(true);
      setProvGranularity(value);
    }
  }

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 7 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 15 },
    },
  };

  const toggleCustomHook = () => {
    if (!customHookExpanded) {
      setCustomHookExpanded(true);
    } else {
      setCustomHookExpanded(false);
    }
  }

  const toggleProcessors = () => {
    if (!processorsExpanded) {
      setProcessorsExpanded(true);
    } else {
      setProcessorsExpanded(false);
    }
  }

  const sourceDbOptions = databaseOptions.map(d => <Option data-testid='sourceDbOptions' key={d}>{d}</Option>);
  const targetDbOptions = databaseOptions.map(d => <Option data-testid='targetDbOptions' key={d}>{d}</Option>);

  const provGranOpts = Object.keys(provGranularityOptions).map(d => <Option data-testid='provOptions' key={provGranularityOptions[d]}>{d}</Option>);

  return <Modal
    visible={props.openAdvancedSettings}
    title={null}
    width="700px"
    onCancel={() => onCancel()}
    onOk={() => onOk()}
    okText="Save"
    className={styles.SettingsModal}
    footer={null}
    maskClosable={false}
  >
    <p className={styles.title}>Advanced Settings</p>
    <p className={styles.stepName}>{props.stepData.name}</p><br/>
    <div className={styles.newDataForm}>
      <Form {...formItemLayout} onSubmit={handleSubmit} colon={true}>
        { usesSourceDatabase ? <Form.Item 
          label={<span>Source Database</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <Select
            id="sourceDatabase"
            placeholder="Please select source database"
            value={sourceDatabase}
            onChange={handleSourceDatabase}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
            aria-label="sourceDatabase-select"
          >
            {sourceDbOptions}
          </Select>&nbsp;&nbsp;
          <div className={styles.selectTooltip}>
            <Tooltip title={tooltips.sourceDatabase}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item> : null
        }<Form.Item 
          label={<span>Target Database</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <Select
            id="targetDatabase"
            placeholder="Please select target database"
            value={targetDatabase}
            onChange={handleTargetDatabase}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
            aria-label="targetDatabase-select"
          >
            {targetDbOptions}
          </Select>
          <div className={styles.selectTooltip}>
            <Tooltip title={tooltips.targetDatabase}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item>
        <Form.Item 
          label={<span>Target Collections</span>} 
          labelAlign="left" 
          className={styles.formItemTargetCollections}
        >
          <Select
            id="additionalColl"
            mode="tags"
            style={{width: '100%'}}
            placeholder="Please select target collections"
            value={defaultCollections.concat(additionalCollections)}
            disabled={!canReadWrite}
            onChange={handleAddColl}
            className={styles.inputWithTooltip}
            aria-label="additionalColl-select"
          >
            {additionalCollections.map((col) => {
              return <Option value={col} key={col} label={col}>{col}</Option>;
            })}
          </Select>
          <div className={styles.inputTooltip}>
            <Tooltip title={tooltips.additionalCollections}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item>
        <Form.Item 
          label={<span>Default Collections</span>} 
          labelAlign="left" 
          className={styles.formItem}
        >
        <div className={styles.defaultCollections}>{defaultCollections.map((collection, i) => {return <div data-testid={`defaultCollections-${collection}`} key={i}>{collection}</div>})}</div>
        </Form.Item>
        <Form.Item 
          label={<span>Target Permissions</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <Input
            id="targetPermissions"
            placeholder="Please enter target permissions"
            value={targetPermissions}
            onChange={handleChange}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
          />
          <div className={styles.inputTooltip}>
            <Tooltip title={tooltips.targetPermissions}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item>
        { usesHeaders ? <>
        <div className={styles.textareaTooltip}>
          <Tooltip title={tooltips.headers}>
            <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
          </Tooltip>
        </div>
        <Form.Item 
          label={<span>Header Content</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <TextArea 
            id="headers"
            placeholder="Please enter header content"
            value={headers}
            onChange={handleChange}
            disabled={!canReadWrite}
            className={styles.textarea}
            rows={6}
            aria-label="headers-textarea"
          />
        </Form.Item></> : null }
        { usesTargetFormat ? <Form.Item 
          label={<span>Target Format</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <Select
            id="targetFormat"
            placeholder="Please select target format"
            value={targetFormat}
            onChange={handleTargetFormat}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
            aria-label="targetFormat-select"
          >
            {targetFormatOptions}
          </Select>
          <div className={styles.inputTooltip}>
            <Tooltip title={tooltips.targetFormat} placement={'right'}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item> : null }
        <Form.Item 
          label={<span>Provenance Granularity</span>} 
          labelAlign="left"
          className={styles.formItem}
        >
          <Select
            id="provGranularity"
            placeholder="Please select provenance granularity"
            value={provGranularity}
            onChange={handleProvGranularity}
            disabled={!canReadWrite}
            className={styles.inputWithTooltip}
            aria-label="provGranularity-select"
          >
            {provGranOpts}
          </Select>
          <div className={styles.selectTooltip}>
            <Tooltip title={tooltips.provGranularity} placement={'right'}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
        </Form.Item>
        <Form.Item 
          label={<span>
            <Icon 
              type="right" 
              className={styles.rightArrow} 
              onClick={toggleProcessors} 
              rotate={processorsExpanded ? 90 : 0}
            />
            <span className={styles.expandLabel} onClick={toggleProcessors}>Processors</span>
          </span>} 
          labelAlign="left"
          className={styles.formItem}
          colon={false}
        />
        { processorsExpanded ? <div className={styles.expandContainer}>
          <div className={styles.textareaExpandTooltip}>
            <Tooltip title={tooltips.processors}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
          <TextArea 
            id="processors"
            placeholder="Please enter processor content"
            value={processors}
            onChange={handleChange}
            disabled={!canReadWrite}
            className={styles.textareaExpand}
            rows={6}
            aria-label="processors-textarea"
          />
        </div> : ''}
        <Form.Item 
          label={<span>
            <Icon 
              type="right" 
              className={styles.rightArrow} 
              onClick={toggleCustomHook} 
              rotate={customHookExpanded ? 90 : 0}
            />
            <span className={styles.expandLabel} onClick={toggleCustomHook}>Custom Hook</span>
          </span>} 
          labelAlign="left"
          className={styles.formItem}
          colon={false}
        />
        { customHookExpanded ? <div className={styles.expandContainer}>
          <div className={styles.textareaExpandTooltip}>
            <Tooltip title={tooltips.customHook}>
              <Icon type="question-circle" className={styles.questionCircle} theme="filled"/>
            </Tooltip>
          </div>
          <TextArea 
            id="customHook"
            placeholder="Please enter custom hook content"
            value={customHook}
            onChange={handleChange}
            disabled={!canReadWrite}
            className={styles.textareaExpand}
            rows={6}
            aria-label="customHook-textarea"
          />
        </div> : ''}
        <Form.Item className={styles.submitButtonsForm}>
          <div className={styles.submitButtons}>
            <Button onClick={() => onCancel()}>Cancel</Button>&nbsp;&nbsp;
            <Button id={'saveButton'} type="primary" htmlType="submit" onClick={handleSubmit} disabled={!canReadWrite}>Save</Button>
          </div>
        </Form.Item>
      </Form>
    </div>
    {deleteConfirmation}
  </Modal>;
}

export default AdvancedSettingsDialog;
