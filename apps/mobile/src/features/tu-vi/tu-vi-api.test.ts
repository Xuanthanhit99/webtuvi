import { tuViApi } from './tu-vi-api';
import { api } from '@/lib/api-client';
jest.mock('@/lib/api-client', () => ({ api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
const get=api.get as jest.Mock, post=api.post as jest.Mock, del=api.delete as jest.Mock;
beforeEach(()=>jest.clearAllMocks());
describe('Tử Vi — API integration contract',()=>{
  it('calculates only on backend, preserves birth input',async()=>{
    const result={id:'chart-1',palaces:{menh:'Tý'},daiVan:[],currentTieuHan:null};
    post.mockResolvedValueOnce(result);
    expect(await tuViApi.calculate({birthDate:'1995-08-21',birthTime:'08:30',sex:'Nam'})).toBe(result);
    expect(post).toHaveBeenCalledWith('/tu-vi/calculate',{birthDate:'1995-08-21',birthTime:'08:30',sex:'Nam'});
  });
  it('lists, reopens and loads history',async()=>{
    get.mockResolvedValue({});
    await tuViApi.list({status:'ARCHIVED',page:2,pageSize:10});
    await tuViApi.get('chart/1');
    await tuViApi.history('chart/1');
    expect(get).toHaveBeenNthCalledWith(1,'/tu-vi/charts?status=ARCHIVED&page=2&pageSize=10');
    expect(get).toHaveBeenNthCalledWith(2,'/tu-vi/charts/chart%2F1');
    expect(get).toHaveBeenNthCalledWith(3,'/tu-vi/charts/chart%2F1/history');
  });
  it('archives, restores, deletes and retries interpretation',async()=>{
    post.mockResolvedValue({});
    del.mockResolvedValue({});
    await tuViApi.archive('one');await tuViApi.restore('one');await tuViApi.remove('one');await tuViApi.interpret('one');
    expect(post).toHaveBeenCalledWith('/tu-vi/charts/one/archive');
    expect(post).toHaveBeenCalledWith('/tu-vi/charts/one/restore');
    expect(del).toHaveBeenCalledWith('/tu-vi/charts/one');
    expect(post).toHaveBeenCalledWith('/tu-vi/charts/one/interpret');
  });
  it('propagates backend errors without fabricating a chart',async()=>{
    post.mockRejectedValueOnce(new Error('unauthorized'));
    await expect(tuViApi.calculate({birthDate:'2000-01-01',birthTime:'12:00',sex:'Nữ'})).rejects.toThrow('unauthorized');
  });
});
