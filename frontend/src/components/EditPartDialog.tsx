
import { IStoreState } from '../types'

import * as React from 'react'
import { Dialog, Input, Notification, DatePicker, Tag, Button } from 'element-react'
import styled from 'styled-components'
// redux

import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetEditPartDialogVisible } from '../actions/appActions'

import Axios from 'axios';
import { serverURL } from 'config';
import getAuthHeader from 'authHeader';

import {IPart, IPartForm, IPartFormAttachment} from 'types'
import Dropzone, { FileWithPreview } from 'react-dropzone';
import {fileSizeHumanReadable, readFileAsDataURL} from '../tools'




const Panel = styled.div`
margin: 50px;
// display: flex;
// flex-direction: column;
// align-items: center;
`;

const Row = styled.div`
width: 100%;
margin: 20px 0px;
display: flex;
align-items: center;
`;

const FormKey = styled.div`
flex: none;
width: 100px;
text-align: left;
`;

const FormValue = styled.div`
flex: auto;
`;

const MyDropzone = styled(Dropzone)`
width: 100%;
height: 5em;
border: solid 1px;
line-height:5em;
`;

const DeletedFileSpan = styled.span`
text-decoration:line-through;
`;

interface IFileValue {
  _id?: string,
  contentType: string,
  fileId?: string,
  fileName: string,
  fileSize: number,
  content?: string,
}

type FormFieldValue = string|number|Date|IFileValue;

interface IFormField {
  name: string,
  type: string,
  key: string,
  value: FormFieldValue,
}

function FormField( name: string, type: string, key:string, value: any) {
  if (type==='multiline' && value.join) {
    return {name, type, key,  value: value.join('\n')};
  } else if (type === 'date') {
    return {name, type, key, value: new Date(value)};
  }
  return {name, type, key, value};
}

interface IProps {
  dialogVisible: boolean,
  partId: string,
  hideDialog: () => void
}

interface IState {
  part?: IPart,
  formFields: IFormField[],
  count: number,
}


const mapStateToProps = (state :IStoreState) => ({
  dialogVisible: state.app.editPartDialogVisible,
  partId: state.app.editPartDialogPartId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetEditPartDialogVisible(false)),
})


class EditPartDialog extends React.Component<IProps, IState> {

  constructor(props:IProps) {
    super(props);
    this.state = {
      formFields: [],
      count: 0,
    }
    this.fetchPartData();
  }  
  public render() {
    const {formFields} = this.state;
    const fields = formFields.map((field:IFormField, index:number) => 
      <Row key={index}>
            <FormKey>
                {field.name}
            </FormKey>
            <FormValue>
                {field.type==='label' && <div>{field.value}</div>}
                {field.type==='input' && <Input value={field.value} onChange={this.onChangeText.bind(this, index)}/>}
                {field.type==='multiline' && <Input type="textarea" autosize={true} value={field.value} onChange={this.onChangeText.bind(this, index)}/>}
                {field.type==='date' && <DatePicker value={field.value as Date} onChange={this.onChangeText.bind(this, index)}/>}
                {field.type==='file' && 
                  <span>
                    {(field.value as IFileValue).fileName} {fileSizeHumanReadable((field.value as IFileValue).fileSize)}
                    <Button type="text" icon="delete" onClick={this.onClickDeleteAttachment.bind(this, index, (field.value as IFileValue).fileId)}/>
                  </span>
                }
                {field.type==='newFile' && 
                  <span>
                    {(field.value as IFileValue).fileName} {fileSizeHumanReadable((field.value as IFileValue).fileSize)}
                    <Button type="text" icon="delete" onClick={this.onClickCancelUploadAttachment.bind(this, index, (field.value as IFileValue).fileId)}/>
                  </span>
                }
                {field.type==='deletedFile' && 
                  <DeletedFileSpan>
                    {(field.value as IFileValue).fileName} {fileSizeHumanReadable((field.value as IFileValue).fileSize)}
                    <Button type="text" icon="plus" onClick={this.onClickCancelDeleteAttachment.bind(this, index, (field.value as IFileValue).fileId)}/>
                  </DeletedFileSpan>
                }
            </FormValue>
      </Row>
    );

    

    return (
      <Dialog
              title="Edit Part"
              // size="large"
              visible={this.props.dialogVisible}
              lockScroll={ false }
              onCancel = {this.onCancel}
      >
        <Dialog.Body>
          <Panel>
              {fields}
              <MyDropzone
                maxSize = {10*1024*1024}
                multiple = {false}
                onDrop={this.onDropFiles}
                rejectStyle={{
                  borderColor:'#f00',
                  backgroundColor:'#f77',
                }}
                acceptStyle={{
                  borderColor:'#0f0',
                  backgroundColor:'#7f7',
                }}
              >
                add more attachments
              </MyDropzone>
          </Panel>          
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="primary" onClick={this.onSubmit}>Submit</Button>
          <Button onClick={this.onCancel}>Cancel</Button>
        </Dialog.Footer>
        
      </Dialog>
    )
  }

  private onDropFiles = async (acceptedFiles: FileWithPreview[], rejectedFiles: FileWithPreview[]) => {
    for (const file of acceptedFiles) {
      const fileContent = await readFileAsDataURL(file);
      // add a new row of attachments
      this.state.formFields.push({
        name: 'attachment',
        type: 'newFile',
        key: Math.random().toString(10),
        value: {  
          contentType: file.type,
          fileName: file.name,
          fileSize: file.size,
          content: fileContent,
        },
      });
      // add a item of new file

      this.setState({count:this.state.count+1}); // just change state to refresh
    }
  }

  private onChangeText = (index:number, content: string) => {
    this.state.formFields[index].value = content;
    this.setState({count:this.state.count+1}); // just change state to refresh
  }

  /**
   * triggered when clicking delete icon on an existing attachment, it will mark
   * the item as "will be deleted", and remove it at submitting.
   * @param number: the index of this.state.formFields array
   * @param fileId: the id of this file in db
   */
  private onClickDeleteAttachment = (index: number, fileId:string) => {
    this.state.formFields[index].type = 'deletedFile';
    this.setState({count:this.state.count+1}); // just change state to refresh
  }
  /**
   * triggered when clicking delete icon again on an existing attachment, it will
   * remove the item from "will be deleted" list.
   */
  private onClickCancelDeleteAttachment = (index: number, fileId:string) => {
    this.state.formFields[index].type = 'file';
    this.setState({count:this.state.count+1}); // just change state to refresh
  }

  /**
   * triggered when clicking delete icon on a newly added attachment, it will remove
   * the added file immediately.
   */
  private onClickCancelUploadAttachment = (index: number, fileId:string) => {
    this.state.formFields.splice(index,1);
    this.setState({count:this.state.count+1}); // just change state to refresh
  }

  private onSubmit = async () => {
    const {formFields} = this.state;
    const partForm:IPartForm = {};
    const attachments:IPartFormAttachment[] = [];
    for (const field of formFields) {
      switch (field.type) {
        case 'label':
        case 'deletedFile':
          // do nothing
          break;
        case 'input':
        case 'date':
          // save this value
          partForm[field.key] = field.value;
          break;
        case 'multiline':
          // convert multiline to array and save
          partForm[field.key] = (field.value as string).split(/\n|;/).filter(item=>item.length>0);
          break;
        case 'file':
        case 'newFile':
          attachments.push(field.value as IPartFormAttachment);
          break;
        default:
          throw new Error(`unknown field type ${field.type}`);
      } 
    }
    partForm.attachments = attachments;
    try {
      await Axios.put(`${serverURL}/api/part/${this.props.partId}`, partForm, getAuthHeader());
      this.props.hideDialog();
    } catch (err) {
      console.error(err);
      Notification.error({title: 'error', message: err.message});
    }
    
  }

  private onCancel = () => {
    this.props.hideDialog();
  }

  private async fetchPartData() {
    const {partId} = this.props;
    try {
      const res = await Axios.get(`${serverURL}/api/part/${partId}`, getAuthHeader());
      const part = res.data;
      const formFields = this.mapPartTofields(part);
      this.setState({part, formFields });
    } catch (err) {
      console.error(err);
      Notification.error({title:'error', message: `${err}`});
    }
  }

  private mapPartTofields(part) {
    const fields:IFormField[] = [];
    if (part) {
      fields.push(FormField('lab name', 'label', 'labName', part.labName));
      fields.push(FormField('personal name', 'label', 'personalName', part.personalName));
      fields.push(FormField('date', 'date', 'date', part.date));
      fields.push(FormField('tags', 'multiline', 'tags', part.tags));
      switch(part.sampleType) {
        case 'bacterium':
          fields.push(FormField('plasmidName', 'input', 'plasmidName', part.content.plasmidName));
          fields.push(FormField('hostStrain', 'input', 'hostStrain', part.content.hostStrain));
          fields.push(FormField('markers', 'multiline', 'markers', part.content.markers));
        break;
        case 'primer':
          fields.push(FormField('sequence', 'input', 'sequence', part.content.sequence));
          fields.push(FormField('orientation', 'input', 'orientation', part.content.orientation));
          fields.push(FormField('meltingTemperature', 'input', 'meltingTemperature', part.content.meltingTemperature));
          fields.push(FormField('concentration', 'input', 'concentration', part.content.concentration));
          fields.push(FormField('vendor', 'input', 'vendor', part.vendor));
        break;
        case 'yeast':
          fields.push(FormField('genotype', 'multiline', 'genotype', part.content.genotype));
          fields.push(FormField('parents', 'multiline', 'parents', part.content.parents));
          fields.push(FormField('markers', 'multiline', 'markers', part.content.markers));
        break;
      }
      fields.push(FormField('comment', 'input', 'comment', part.comment));
      if (part.content && part.content.customData) {
        for(const key of Object.keys(part.content.customData)){
          fields.push(FormField(key, 'input', key, part.content.customData[key]));
        }
      }
      if (part.attachments) {
        for(const attachment of part.attachments){
          fields.push(FormField('attachment', 'file', attachment.fileId, attachment));
        }
      }
    }
    return fields;
  }
}



export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPartDialog))
