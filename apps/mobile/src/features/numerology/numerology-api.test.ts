import { numerologyApi } from './numerology-api';
import { api } from '@/lib/api-client';
jest.mock('@/lib/api-client', () => ({ api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
const get=api.get as jest.Mock, post=api.post as jest.Mock, del=api.delete as jest.Mock;
beforeEach(()=>jest.clearAllMocks());
describe('Thần số học — API integration contract',()=>{
  it('sends birth name and date without client-side calculations',async()=>{
    const result={id:'reading-1',values:[{type:'LIFE_PATH',value:7}]};
    post.mockResolvedValueOnce(result);
    expect(await numerologyApi.calculate('Nguyễn Văn An','1998-05-12')).toBe(result);
    expect(post).toHaveBeenCalledWith('/numerology/calculate',{fullBirthName:'Nguyễn Văn An',birthDate:'1998-05-12'});
  });
  it('lists, reopens and loads history',async()=>{
    get.mockResolvedValue({});
    await numerologyApi.list({status:'ARCHIVED',page:2,pageSize:10});
    await numerologyApi.get('r/1');await numerologyApi.history('r/1');
    expect(get).toHaveBeenNthCalledWith(1,'/numerology/readings?status=ARCHIVED&page=2&pageSize=10');
    expect(get).toHaveBeenNthCalledWith(2,'/numerology/readings/r%2F1');
    expect(get).toHaveBeenNthCalledWith(3,'/numerology/readings/r%2F1/history');
  });
  it('archives, restores, deletes, loads meanings and retries interpretation',async()=>{
    post.mockResolvedValue({});del.mockResolvedValue({});get.mockResolvedValue([]);
    await numerologyApi.archive('r');await numerologyApi.restore('r');await numerologyApi.remove('r');
    await numerologyApi.interpret('r');await numerologyApi.meanings();
    expect(post).toHaveBeenCalledWith('/numerology/readings/r/archive');
    expect(post).toHaveBeenCalledWith('/numerology/readings/r/restore');
    expect(del).toHaveBeenCalledWith('/numerology/readings/r');
    expect(post).toHaveBeenCalledWith('/numerology/readings/r/interpret');
    expect(get).toHaveBeenCalledWith('/numerology/meanings');
  });
  it('propagates backend errors without substituting fixture results',async()=>{
    post.mockRejectedValueOnce(new Error('server unavailable'));
    await expect(numerologyApi.calculate('Test','2000-01-01')).rejects.toThrow('server unavailable');
  });
});
