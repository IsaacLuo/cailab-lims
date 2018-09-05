import * as React from 'react'
import { Table, Input, DatePicker, Tag, Button } from 'element-react'
import Dropzone from 'react-dropzone'
import styled from 'styled-components'
// redux
import { IStoreState } from './store'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetUploadPartsDialogVisible } from './actions'

// helpers
import { serverURL } from './config'
import getAuthHeader from './authHeader'
import * as xlsx from 'xlsx'
import {readFileAsBuffer,readFileAsDataURL, PartFormReader} from './tools'
import {IColumn, IAttachmentDataURL} from './types'
import axios from 'axios';

const MyPanel = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
`
const MyDropzone = styled(Dropzone)`
  width:300px;
  height:200px;
  display:flex;
  border: solid 1px #000;
`
const MiniDropzone = styled(Dropzone)`
  width:100%;
  border: solid 1px rgba(0,0,0,0.01);
  box-sizing: border-box;
`

const DropzopnHint = styled.div`
  display:flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
`
const GreenText = styled.span`
  color: green;
`
const RedText = styled.span`
  color: red;
`

interface IProps {
  sampleType: string,
  hideDialog: () => void
}

interface IState {
  partsForm: any[],
  formTitles: IColumn[],
}

class UploadPartsDialog extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
      partsForm: [],
      formTitles: [],
    }
  }  
  public render() {
    const {sampleType} = this.props;
    const {partsForm, formTitles} = this.state;
    return (
      <MyPanel>
        {partsForm.length === 0 ? 
        <div>
          <div>only modified xlsx from the <a href={`${serverURL}/public/bacterium_template.xlsx`}>template</a></div>
          <MyDropzone
            maxSize = {10*1024*1024}
            accept = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
            <DropzopnHint>
              drag and drop xlsx file to here or click
            </DropzopnHint>
          </MyDropzone>
        </div>
        :
        <div style={{width:'100%'}}>
          <Table
            style={{width: '100%'}}
            columns={formTitles}
            data={partsForm}
          />
          <Button onClick={this.submitParts}> submit </Button>
        </div>
        }
      </MyPanel>
    )
  }

  private onCancel = () => {
    this.props.hideDialog();
  }
  private onDropFiles = async (acceptedFiles:File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      const excelFile = acceptedFiles[0];
      const data = await readFileAsBuffer(excelFile);
      const workbook = xlsx.read(data, {type:'buffer'});
      console.log(workbook);
      const partFormReader = PartFormReader.fromWorkBook(workbook);
      this.setState({
        formTitles: [
          {label:'status', prop:'tags', width:200, fixed: 'left', render: (row)=><span>
            {row.submitStatus === 'OK' ? 
              <GreenText>{`${row.labName}:${row.personalName}`}</GreenText> : 
              row.submitStatus === 'ready' ? 
              <span>ready to submit</span>: 
              <RedText>failed</RedText>
            }
          </span>}, 
          ...partFormReader.getHeaders().map(val => {
          if (val === 'date'){
            return {label:val, prop: val, width:200, render: (row) => 
              <span>
                {row.date.toLocaleDateString()}
              </span>
            }
          } else {
            return {label:val, prop: val, width:200};
          }
        }),
        {label:'attachments', prop:'tags', width:200, fixed: 'left', render: (row)=><span>
          <MiniDropzone
            maxSize={10*1024*1024}
            onDrop={this.onDropAttachments.bind(this, row.attachments)}
            rejectStyle={{
              borderColor:'#f00',
              backgroundColor:'#f77',
            }}
            acceptStyle={{
              borderColor:'#0f0',
              backgroundColor:'#7f7',
            }}
            >
            <DropzopnHint>
              {row.attachments.length > 0?
                row.attachments.map(item=>
                  <div key={item.name}>{item.name}:{item.size}</div>
                  ):
                <div>'upload attachments'</div>
              }
            </DropzopnHint>
          </MiniDropzone>
        </span>}, 
        ],
        partsForm: partFormReader.readData(),
      });
    }
  }

  private onDropAttachments = async (storage: IAttachmentDataURL[], acceptedFiles:File[]) => {
    for(const attachment of acceptedFiles) {
      const attachmentContent:string = await readFileAsDataURL(attachment);
      storage.push({name:attachment.name, size: attachment.size, content:attachmentContent});
    }
  }

  private submitParts = () => {
    for(const newPartForm of this.state.partsForm) {
      axios.post(serverURL+'/api/part/new')
    }
  }
}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetUploadPartsDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UploadPartsDialog))
