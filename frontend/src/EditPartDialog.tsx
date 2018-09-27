import * as React from 'react'
import { Dialog, Input, Notification, DatePicker, Tag, Button } from 'element-react'
import styled from 'styled-components'
// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetEditPartDialogVisible } from './actions'
import TagInput from './TagInput';
import Axios from 'axios';
import { serverURL } from 'config';
import getAuthHeader from 'authHeader';

import {IPart, IPartForm} from 'types'




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

interface IFormField {
  name: string,
  type: string,
  key: string,
  value: any,
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
                {field.type==='date' && <DatePicker value={field.value}/>}
            </FormValue>
      </Row>
    )

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
          </Panel>
        </Dialog.Body>
        <Dialog.Footer>
          <Button type="primary" onClick={this.onSubmit}>Submit</Button>
          <Button onClick={this.onCancel}>Cancel</Button>
        </Dialog.Footer>
        
      </Dialog>
    )
  }

  private onChangeText = (index:number, content: string) => {
    this.state.formFields[index].value = content;
    this.setState({count:this.state.count+1}); // just change state to refresh
  }

  private onSubmit = async () => {
    const {formFields} = this.state;
    const partForm:IPartForm = {}
    for (const field of formFields) {
      if (field.type === 'multiline'){
        partForm[field.key] = field.value.split(/\n|;/).filter(item=>item.length>0);
      } else {
        partForm[field.key] = field.value;
      }
    }
    try {
      await Axios.put(`${serverURL}/api/part/${this.props.partId}`, partForm, getAuthHeader());
    } catch (err) {
      console.log(err);
    }

    this.props.hideDialog();
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
          fields.push(FormField(key, 'input', key, part.content[key]));
        }
      }
    }
    return fields;
  }
}

const mapStateToProps = (state :IStoreState) => ({
  dialogVisible: state.editPartDialogVisible,
  partId: state.editPartDialogPartId,
})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetEditPartDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPartDialog))
