import { natalChartApi } from './natal-chart-api';
import { api } from '@/lib/api-client';
jest.mock('@/lib/api-client', () => ({ api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() } }));
const get=api.get as jest.Mock, post=api.post as jest.Mock, del=api.delete as jest.Mock;
beforeEach(()=>jest.clearAllMocks());
describe('Bản đồ sao — API integration contract',()=>{
  it('gets opaque location token and sends it back unchanged',async()=>{
    get.mockResolvedValueOnce([{token:'opaque-token',label:'Hà Nội'}]);
    const [place]=await natalChartApi.searchLocation('Hà Nội');
    post.mockResolvedValueOnce({id:'natal-1',placements:[],houses:[],aspects:[]});
    await natalChartApi.create({birthDate:'1998-05-12',locationToken:place.token});
    expect(get).toHaveBeenCalledWith('/geocoding/search?q=H%C3%A0%20N%E1%BB%99i');
    expect(post).toHaveBeenCalledWith('/natal-charts',{birthDate:'1998-05-12',locationToken:'opaque-token'});
  });
  it('lists, reopens and loads history',async()=>{
    get.mockResolvedValue({});
    await natalChartApi.list({status:'DELETED',page:3,pageSize:10});
    await natalChartApi.get('n/1');await natalChartApi.history('n/1');
    expect(get).toHaveBeenNthCalledWith(1,'/natal-charts?status=DELETED&page=3&pageSize=10');
    expect(get).toHaveBeenNthCalledWith(2,'/natal-charts/n%2F1');
    expect(get).toHaveBeenNthCalledWith(3,'/natal-charts/n%2F1/history');
  });
  it('archives, restores, deletes and retries interpretation',async()=>{
    post.mockResolvedValue({});del.mockResolvedValue({});
    await natalChartApi.archive('n');await natalChartApi.restore('n');await natalChartApi.remove('n');await natalChartApi.interpret('n');
    expect(post).toHaveBeenCalledWith('/natal-charts/n/archive');
    expect(post).toHaveBeenCalledWith('/natal-charts/n/restore');
    expect(del).toHaveBeenCalledWith('/natal-charts/n');
    expect(post).toHaveBeenCalledWith('/natal-charts/n/interpret');
  });
  it('propagates expired token and network errors',async()=>{
    post.mockRejectedValueOnce(new Error('expired token'));
    await expect(natalChartApi.create({birthDate:'2000-01-01',locationToken:'expired'})).rejects.toThrow('expired token');
  });
});
