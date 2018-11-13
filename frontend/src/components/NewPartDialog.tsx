import * as React from 'react'
import { Dialog, Input, DatePicker, Tag, Button } from 'element-react'
import styled from 'styled-components'
// redux
import { IStoreState } from '../types'
import { Dispatch } from 'redux'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { ActionSetNewPartDialogVisible } from '../actions/appActions'
import TagInput from './TagInput';




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

const MyTag = styled(Tag)`
margin-right: 10px;
`;

interface IProps {
  sampleType: string,
  hideDialog: () => void
}

interface IState {
  date: Date,
  tags: string[],
  comment: string,

  // primers only
  description?: string,
  sequence?: string,
  orientation?: string,
  meltingTemperature?: number,
  concentration?: string,
  vendor?: string,
  
  // bacteria only
  plasmidName?: string,
  hostStrain?: string,

  // yeasts only
  parents?: string[],
  genotype?: string[],
  plasmidType?: string,

  // bacteria and yeasts
  markers?: string[],
  // all
  customData?: any,


  newTagInputValue: string,
  newTagInputVisible: boolean,
}

class NewPartDialog extends React.Component<IProps, IState> {
  public tagInputRef:React.RefObject<Input> = React.createRef()

  constructor(props:IProps) {
    super(props);
    this.state = {
      comment: '',
      date: new Date(),
      tags: [],
      genotype: [],
      markers: [],
      parents: [],
      newTagInputValue: '',
      newTagInputVisible: false,
    }
  }  
  public render() {
    const {sampleType} = this.props;
    const {date, tags} = this.state;
    return (
      <Dialog
              title="create new part"
              // size="large"
              visible={true}
              lockScroll={ false }
              onCancel = {this.onCancel}
      >
      <Panel>
        <Row>
          <FormKey>
            name
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>

        <Row>
          <FormKey>
            date
          </FormKey>
          <FormValue>
            <DatePicker
              value={date}
              placeholder="date"
              onChange={this.onChangeDate}
              style={{width:'100%'}}
              />
          </FormValue>
        </Row>

        <Row>
          <FormKey>
            tags
          </FormKey>
          <FormValue>
            <TagInput
              tags={tags}
              onChange={this.onChangeTags}
            />
          </FormValue>
        </Row>

        <Row>
          <FormKey>
            comment
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>

        {sampleType === 'bacterium' && this.bacteriumRows()}
        {sampleType === 'primer' && this.primerRows()}
        {sampleType === 'yeast' && this.yeastRows()}

      </Panel>
      </Dialog>
    )
  }

  private bacteriumRows () {
    return (<div>
      <Row>
          <FormKey>
            pasmid name
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            host strain
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            markers
          </FormKey>
          <FormValue>
            <TagInput
              tags={this.state.markers}
              onChange={this.onChangeMarkers}
            />
          </FormValue>
        </Row>
    </div>)
  }
  private primerRows () {
    return <div>
      <Row>
          <FormKey>
            description
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            sequence
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            orientation
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            melting temperature
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
          <Row>
          <FormKey>
            concentration
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            vendor
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
    </div>
  }
  private yeastRows () {
    return <div>
      <Row>
          <FormKey>
            parents
          </FormKey>
          <FormValue>
          <TagInput
              tags={this.state.parents}
              onChange={this.onChangeParents}
            />
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            genotype
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            plasmidType
          </FormKey>
          <FormValue>
            <Input/>
          </FormValue>
        </Row>
        <Row>
          <FormKey>
            markers
          </FormKey>
          <FormValue>
          <TagInput
              tags={this.state.markers}
              onChange={this.onChangeMarkers}
            />
          </FormValue>
        </Row>
    </div>
  }

  private onCancel = () => {
    this.props.hideDialog();
  }

  private onChangeDate = date => {
    this.setState({date})
  }

  private onChangeTags = tags => {
    this.setState({tags});
  }
  private onChangeMarkers = markers => {
    this.setState({markers});
  }

  private onChangeParents = parents => {
    this.setState({parents});
  }
}

const mapStateToProps = (state :IStoreState) => ({

})

const mapDispatchToProps = (dispatch :Dispatch) => ({
  hideDialog: () => dispatch(ActionSetNewPartDialogVisible(false)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NewPartDialog))
